# Ashtavinayak Trust Website

A multi-page trust website for **Ashtavinayak Mahannadan Sohala Trust** with:
- Home page (`index.html`)
- About page (`about.html`)
- Annadan page (`annadan.html`)
- Donate page (`donate.html`)
- Backend donation API (`/api/donate`) that creates UPI payment links and stores donation requests

## Run locally

```bash
npm start
```

Open: `http://localhost:3000`

## API

### `POST /api/donate`
Creates a donation request and returns receipt and UPI links.

Example payload:

```json
{
  "name": "Donor Name",
  "phone": "9876543210",
  "email": "donor@example.com",
  "amount": 501,
  "message": "Annadan seva"
}
```
