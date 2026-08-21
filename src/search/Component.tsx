'use client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import React, { useState, useEffect } from 'react'
import { useDebounce } from '@/utilities/useDebounce'
import { useParams, useRouter } from 'next/navigation'
import { defaultLocale, isLocale } from '@/i18n/locales'

export const Search: React.FC = () => {
  const [value, setValue] = useState('')
  const router = useRouter()
  const params = useParams()
  const localeParam = Array.isArray(params.locale) ? params.locale?.[0] : params?.locale
  const locale = isLocale(localeParam) ? localeParam : defaultLocale

  const debouncedValue = useDebounce(value)

  useEffect(() => {
    router.push(`/${locale}/search${debouncedValue ? `?q=${debouncedValue}` : ''}`)
  }, [debouncedValue, locale, router])

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
        }}
      >
        <Label htmlFor="search" className="sr-only">
          Search
        </Label>
        <Input
          id="search"
          onChange={(event) => {
            setValue(event.target.value)
          }}
          placeholder="Search"
        />
        <button type="submit" className="sr-only">
          submit
        </button>
      </form>
    </div>
  )
}
