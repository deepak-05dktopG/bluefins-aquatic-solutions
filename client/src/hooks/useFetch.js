/**
 * What it is: Reusable React hook for loading data from the server.
 * Non-tech note: Used to “fetch” information and show loading/error states.
 */

import { useState, useEffect } from 'react'
import api from '../api/api'

// Custom React hook that fetches data from the given API endpoint with loading/error state
const useFetch = url => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(
  // Triggers the API call whenever the URL changes
  () => {
    // Calls the server API and stores the response in state
    const fetchData = async () => {
      try {
        const response = await api.get(url)
        setData(response.data)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    };

    fetchData()
  }, [url])

  return { data, loading, error }
};

export default useFetch