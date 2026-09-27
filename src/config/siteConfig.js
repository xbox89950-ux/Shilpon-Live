// Edit this single file to update Shilpon's identity, contact details, delivery pricing and palette.
export const siteConfig = {
  brandName: 'Shilpon',
  tagline: 'Made with care, close to home.',
  founderName: 'Walid Akber',
  logoPath: `${import.meta.env.BASE_URL}images/shilpon-logo.png`, // Your supplied logo is copied to public/images; replace this path to change it.
  bannerPath: `${import.meta.env.BASE_URL}images/shilpon-banner.svg`, // Replace with your banner file in public/images.
  whatsappNumber: '01727227189', // Stored as entered; WhatsApp links add Bangladesh's 88 prefix automatically.
  phone: '+880 1717-802606',
  email: 'walidakber302@gmail.com',
  address: 'Dinajpur, Rangpur, Bangladesh',
  currency: '৳',
  delivery: { inside: 60, outside: 120, freeOver: 3000 },
  colors: { ink: '#20352c', green: '#355a48', lime: '#d6e2ad', cream: '#f7f6f2', coral: '#d98264' },
  social: { facebook: 'https://facebook.com/', instagram: 'https://instagram.com/', tiktok: 'https://tiktok.com/' },
}
