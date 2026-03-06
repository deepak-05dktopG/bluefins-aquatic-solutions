/**
 * What it is: Email sending helper (Nodemailer).
 * Non-tech note: Used when the server needs to send an email.
 */

import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

// Sends transactional emails (membership confirmations, payment receipts) via Nodemailer
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent: ', info.messageId)
    return info
  } catch (error) {
    console.error('Email sending failed:', error)
    throw error
  }
};

export default sendEmail