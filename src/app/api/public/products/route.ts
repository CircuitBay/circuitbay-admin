import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'
import type { Category, Media, Product, Stock } from '@/payload-types'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return NextResponse.json(null, { headers: corsHeaders })
}

async function fetchCategoryMeta(payload: Awaited<ReturnType<typeof getPayload>>) {
  const { docs } = await payload.find({ collection: 'categories', pagination: false, depth: 0 })
  const counts = await Promise.all(
    docs.map((cat) =>
      payload
        .count({
          collection: 'products',
          where: { and: [{ status: { equals: 'active' } }, { category: { equals: cat.id } }] },
        })
        .then(({ totalDocs }) => ({ name: cat.name, slug: cat.slug, count: totalDocs })),
    ),
  )
  return counts
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10))
  const search = searchParams.get('search')?.trim() || ''
  const categorySlug = searchParams.get('category')?.trim() || ''

  const payload = await getPayload({ config })

  const categoriesPromise = fetchCategoryMeta(payload)

  const conditions: Where[] = [{ status: { equals: 'active' } }]

  if (search) {
    conditions.push({
      or: [{ name: { like: search } }, { description: { like: search } }],
    })
  }

  if (categorySlug) {
    const categoryResult = await payload.find({
      collection: 'categories',
      where: { slug: { equals: categorySlug } },
      limit: 1,
      depth: 0,
    })
    if (categoryResult.docs.length === 0) {
      return NextResponse.json(
        {
          products: [],
          metadata: {
            page, limit, totalDocs: 0, totalPages: 0,
            hasNextPage: false, hasPrevPage: false,
            categories: await categoriesPromise,
          },
        },
        { headers: corsHeaders },
      )
    }
    conditions.push({ category: { equals: categoryResult.docs[0].id } })
  }

  const where: Where = conditions.length > 1 ? { and: conditions } : conditions[0]

  const productsResult = await payload.find({
    collection: 'products',
    where,
    page,
    limit,
    depth: 1,
    sort: '-createdAt',
  })

  const productIds = productsResult.docs.map((p) => p.id)

  const [stockResult, categories] = await Promise.all([
    productIds.length > 0
      ? payload.find({
          collection: 'stock',
          where: { product: { in: productIds } },
          limit: productIds.length,
          depth: 0,
        })
      : Promise.resolve({ docs: [] as Stock[] }),
    categoriesPromise,
  ])

  const stockByProduct = new Map<string, Pick<Stock, 'quantity' | 'status'>>()
  for (const s of stockResult.docs) {
    const pid = typeof s.product === 'string' ? s.product : s.product.id
    stockByProduct.set(pid, { quantity: s.quantity, status: s.status })
  }

  const products = productsResult.docs.map((p) => ({
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    price: p.price,
    category: p.category ? (p.category as Category).name : null,
    images: (p.images as Media[] | undefined)?.map((img) => img.url).filter(Boolean) ?? [],
    stock: stockByProduct.get(p.id) ?? { quantity: 0, status: 'out_of_stock' as const },
  }))

  return NextResponse.json(
    {
      products,
      metadata: {
        page: productsResult.page,
        limit: productsResult.limit,
        totalDocs: productsResult.totalDocs,
        totalPages: productsResult.totalPages,
        hasNextPage: productsResult.hasNextPage,
        hasPrevPage: productsResult.hasPrevPage,
        categories,
      },
    },
    { headers: corsHeaders },
  )
}
