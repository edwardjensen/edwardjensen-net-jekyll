module.exports = {
    content: [
      './_includes/**/*.html',
      './_layouts/**/*.html',
      './_portfolio/**/*.md',
      './_featured-tags/**/*.md',
      './_feeds/**/*.html',
      './_sections_homepage/**/*.html',
      './_sections_landing/**/*.html',
      './_sections_camerastream/**/*.html',
      './_site_pages/**/*.md',
      './*.{md,html}',
      './_data/**/*.yml',
    ],
    darkMode: 'media', // Enable system-based dark mode
    theme: {
      extend: {
        colors: {
          brand: {
            ink: '#001524',       // Dark mode background, light mode text
            orange: '#F58F29',    // Primary accent
            'orange-dark': '#a95b00', // Accessible orange (4.5:1 on smoke)
            grey: '#767B91',      // Secondary text, muted elements
            'grey-dark': '#5A5E6D', // High contrast muted text (light mode)
            'grey-light': '#9499AB', // High contrast muted text (dark mode)
            chestnut: '#772E25',  // Hover states, focus outlines
            smoke: '#F3F3F3',     // Light mode background, dark mode text
          },
        },
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