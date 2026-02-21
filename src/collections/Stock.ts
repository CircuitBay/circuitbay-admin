import type { CollectionConfig, CollectionBeforeChangeHook } from 'payload'
import { nanoid } from 'nanoid'

const updateStatus: CollectionBeforeChangeHook = ({ data }) => {
  if (data?.quantity !== undefined) {
    data.status = data.quantity <= 0 ? 'out_of_stock' : 'in_stock'
  }
  return data
}

export const Stock: CollectionConfig = {
  slug: 'stock',
  admin: {
    defaultColumns: ['product', 'quantity', 'status'],
  },
  hooks: {
    beforeChange: [updateStatus],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      defaultValue: () => nanoid(),
      admin: { readOnly: true },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      unique: true,
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'out_of_stock',
      admin: { position: 'sidebar', readOnly: true },
      options: [
        { label: 'In Stock', value: 'in_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' },
      ],
    },
  ],
}
