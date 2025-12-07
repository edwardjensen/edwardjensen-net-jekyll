module.exports = {
    content: [
      './_drafts/**/*.{html,md}',
      './_includes/**/*.html',
      './_layouts/**/*.html',
      './_posts/**/*.md',
      './_pages/**/*.md',
      './_micro/**/*.md',
      './_photography/**/*.md',
      './_portfolio/**/*.md',
      './_working_notes/**/*.md',
      './_homepage_sections/**/*.html',
      './_landing_sections/**/*.html',
      './_feeds/**/*.html',
      './*.{md,html}',
      './_data/**/*.yml',
    ],
    // NOTE: Safelist may not be necessary with comprehensive content paths above.
    // Tailwind v4's scanner detects classes in HTML, JS template strings, and YAML.
    // Consider removing if build output is acceptable.
    safelist: [],
    darkMode: 'media', // Enable system-based dark mode
    theme: {
      extend: {
        fontSize: {
          'xs': ['0.75rem', { lineHeight: '1rem' }],
          'sm': ['0.875rem', { lineHeight: '1.25rem' }],
          'base': ['1rem', { lineHeight: '1.6' }],
          'lg': ['1.125rem', { lineHeight: '1.75rem' }],
          'xl': ['1.25rem', { lineHeight: '1.75rem' }],
          '2xl': ['1.5rem', { lineHeight: '2rem' }],
          '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
          '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
          '5xl': ['3rem', { lineHeight: '1.2' }],
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography')
    ]
  }