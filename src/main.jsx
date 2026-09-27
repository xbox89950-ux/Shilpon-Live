import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import './coupon.css'
import './admin.css'
import './admin-extra.css'

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
