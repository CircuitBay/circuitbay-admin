import type { CollectionConfig } from 'payload'
import { nanoid } from 'nanoid'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      defaultValue: () => nanoid(),
      admin: { readOnly: true },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
}
