import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig = {
  serverExternalPackages: ['jose', 'pg-cloudflare'],
  images: {
    unoptimized: true,
  },
  webpack: (webpackConfig: any) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
