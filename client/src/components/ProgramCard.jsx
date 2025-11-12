import React from 'react'
import { Card, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const ProgramCard = ({ program }) => {
  const { title, description, level, duration, price } = program

  return (
    <Card className="h-100 shadow-sm">
      <Card.Body>
        <Card.Title as="h3" className="mb-3">{title}</Card.Title>
        <Card.Text>{description}</Card.Text>
        <ul className="list-unstyled">
          {level && (
            <li className="mb-2">
              <strong>Level:</strong> {level}
            </li>
          )}
          {duration && (
            <li className="mb-2">
              <strong>Duration:</strong> {duration}
            </li>
          )}
          {price && (
            <li className="mb-3">
              <strong>Price:</strong> ${price}
            </li>
          )}
        </ul>
        <Link to="/contact">
          <Button variant="primary" className="w-100">
            Enroll Now
          </Button>
        </Link>
      </Card.Body>
    </Card>
  )
}

export default ProgramCard