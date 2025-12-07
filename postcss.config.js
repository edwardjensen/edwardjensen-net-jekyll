module.exports = {
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
    ...(process.env.JEKYLL_ENV === 'production' || process.env.JEKYLL_ENV === 'staging' ? [require('cssnano')({ preset: 'default' })] : [])
  ]
}