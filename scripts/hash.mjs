import bcrypt from 'bcryptjs'

const password = process.argv[2]
if (!password) {
  console.error('Usage: node scripts/hash.mjs <password>')
  process.exit(1)
}

const salt = bcrypt.genSaltSync(10)
const hash = bcrypt.hashSync(password, salt)
console.log(hash)
