// "use strict"

// module.exports = function requireScopes(required = [], { mode = 'any' } = {}) {
//   if (!Array.isArray(required)) required = [required]
//   return (req, res, next) => {
//     const keyScopes = (req.apiKey && req.apiKey.scopes) || []
//     const ok = mode === 'all' ? required.every(r => keyScopes.includes(r)) : required.some(r => keyScopes.includes(r))
//     if (!ok) return res.status(403).json({ message: 'Insufficient scope' })
//     next()
//   }
// }

module.exports = function requireScopes(required = [], { mode = 'any' }, {} ) {
    return (req, res, next) => {
        const keyScopes = (req.apiKey )
    }
}