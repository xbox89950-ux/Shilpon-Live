import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const [owner, repository] = (process.env.GITHUB_REPOSITORY || '').split('/')
const isUserSite = repository && repository === `${owner}.github.io`
const base = repository ? (isUserSite ? '/' : `/${repository}/`) : './'

export default defineConfig({ plugins: [react()], base })
