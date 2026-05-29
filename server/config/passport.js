// server/config/passport.js
const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Extract JWT from cookie OR Authorization header
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) token = req.cookies['access_token'];
  return token;
};

// JWT Strategy — used to protect routes
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([
      cookieExtractor,
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: process.env.JWT_SECRET,
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (err) {
      return done(err, false);
    }
  }
));

// Google OAuth Strategy
passport.use(new GoogleStrategy(
  {
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      // Find or create user
      let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

      if (!user) {
        // Check if email already exists (user registered manually before)
        user = await prisma.user.findUnique({ where: { email } });
        if (user) {
          // Link Google account to existing user
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id },
          });
        } else {
          // Brand new user via Google
          user = await prisma.user.create({
            data: {
              email,
              googleId: profile.id,
              role: 'EMPLOYEE',
              employee: {
                create: {
                  name: profile.displayName,
                  avatarUrl: profile.photos?.[0]?.value,
                },
              },
            },
          });
        }
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;
