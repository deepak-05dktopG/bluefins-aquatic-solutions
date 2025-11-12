import express from 'express'
import { createEnquiry } from '../controllers/enquiryController.js'

const router = express.Router()

router.route('/enquiries').post(createEnquiry)

export default router