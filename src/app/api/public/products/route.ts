import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Category, Media, Product, Stock } from '@/payload-types'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 10))

  const payload = await getPayload({ config })

  const productsResult = await payload.find({
    collection: 'products',
    where: { status: { equals: 'active' } },
    page,
    limit,
    depth: 1,
    sort: '-createdAt',
  })

  const productIds = productsResult.docs.map((p) => p.id)

  const stockResult =
    productIds.length > 0
      ? await payload.find({
          collection: 'stock',
          where: { product: { in: productIds } },
          limit: productIds.length,
          depth: 0,
        })
      : { docs: [] }

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

  return NextResponse.json({
    products,
    metadata: {
      page: productsResult.page,
      limit: productsResult.limit,
      totalDocs: productsResult.totalDocs,
      totalPages: productsResult.totalPages,
      hasNextPage: productsResult.hasNextPage,
      hasPrevPage: productsResult.hasPrevPage,
    },
  })
}
