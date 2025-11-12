import asyncHandler from 'express-async-handler'
import Enquiry from '../models/Program.js'
import { sendEmail } from '../utils/emailService.js'

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
const createEnquiry = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body

  const enquiry = await Enquiry.create({
    name,
    email,
    message,
  })

  // Send notification email
  await sendEmail({
    to: process.env.EMAIL_USER, // Admin email
    subject: 'New Enquiry Received',
    html: `
      <h2>New Enquiry from ${name}</h2>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    `,
  })

  // Send confirmation email to user
  await sendEmail({
    to: email,
    subject: 'Thank you for contacting Blue Fins',
    html: `
      <h2>Thank you for your enquiry, ${name}!</h2>
      <p>We have received your message and will get back to you shortly.</p>
      <p>Best regards,<br>Blue Fins Team</p>
    `,
  })

  res.status(201).json(enquiry)
})

export { createEnquiry }