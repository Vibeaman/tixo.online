export default async function handler(req, res) {
  const { code } = req.query

  if (!code || typeof code !== 'string' || code.length < 4) {
    return res.redirect(302, '/')
  }

  res.redirect(302, `/signup?ref=${encodeURIComponent(code)}`)
}
