// Open-Meteo (no API key) + IP geolocation fallback (no browser permission needed)

export type WeatherCondition = 'Hot' | 'Cold' | 'Rain' | 'All'

export interface WeatherInfo {
  condition: WeatherCondition
  label:     string
  icon:      string
  tempC:     number
  city:      string
}

interface Coords {
  latitude:  number
  longitude: number
  city?:     string
}

async function getBrowserLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('no geolocation')); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err),
      { timeout: 5000, maximumAge: 300_000 }
    )
  })
}

async function getIPLocation(): Promise<Coords> {
  const res  = await fetch('https://ipapi.co/json/')
  const data = await res.json()
  if (!data.latitude) throw new Error('IP geolocation failed')
  return { latitude: data.latitude, longitude: data.longitude, city: data.city ?? '' }
}

async function getCoords(): Promise<Coords> {
  try {
    return await getBrowserLocation()
  } catch {
    return await getIPLocation()
  }
}

async function getCityName(lat: number, lon: number): Promise<string> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    return data.address?.city ?? data.address?.town ?? data.address?.county ?? ''
  } catch {
    return ''
  }
}

function codeToCondition(code: number, tempC: number): WeatherCondition {
  if ([51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code)) return 'Rain'
  if (tempC < 15) return 'Cold'
  if (tempC > 28) return 'Hot'
  return 'All'
}

function getLabel(condition: WeatherCondition, code: number): string {
  if (condition === 'Rain') return 'Rainy'
  if (condition === 'Cold') return 'Cold'
  if (condition === 'Hot')  return 'Hot'
  return [1,2,3,45,48].includes(code) ? 'Cloudy' : 'Clear'
}

function getIcon(condition: WeatherCondition): string {
  if (condition === 'Rain') return '🌧️'
  if (condition === 'Cold') return '🥶'
  if (condition === 'Hot')  return '☀️'
  return '⛅'
}

export async function getWeatherInfo(): Promise<WeatherInfo> {
  const coords = await getCoords()

  const [weatherRes, city] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${coords.latitude}&longitude=${coords.longitude}` +
      `&current=temperature_2m,weathercode`
    ),
    coords.city ? Promise.resolve(coords.city) : getCityName(coords.latitude, coords.longitude),
  ])

  if (!weatherRes.ok) throw new Error('Open-Meteo API error')
  const data = await weatherRes.json()

  const tempC    = Math.round(data.current?.temperature_2m ?? 20)
  const code     = (data.current?.weathercode ?? 0) as number
  const condition = codeToCondition(code, tempC)

  return { condition, label: getLabel(condition, code), icon: getIcon(condition), tempC, city }
}
