import './style.scss'
import 'bootstrap/dist/css/bootstrap.min.css'
import { Application } from './Application.js'

// Initialize the application
const canvas = document.getElementById('canvas')
const app = new Application()
app.init(canvas)
