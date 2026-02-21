import type { CollectionConfig } from 'payload'
import { nanoid } from 'nanoid'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  upload: {
    crop: false,
    focalPoint: false,
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      defaultValue: () => nanoid(),
      admin: { readOnly: true },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
}
