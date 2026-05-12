const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/User");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/auth/google/callback",
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // 1. Find by googleId first
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 2. Match by email to link with existing account
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) {
              user.avatar = profile.photos[0].value;
            }
            await user.save();
            return done(null, user);
          }
        }

        // 3. Create new parent account
        user = await User.create({
          googleId: profile.id,
          username: `google_${profile.id}`,
          email,
          displayName: profile.displayName || profile.name?.givenName || "Google User",
          avatar: profile.photos?.[0]?.value || "",
          role: "parent",
          isApproved: true,
        });
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Required for OAuth session handshake (not used for app auth — we use JWT)
passport.serializeUser((user, done) => done(null, user._id.toString()));
passport.deserializeUser(async (id, done) => {
  try {
    done(null, await User.findById(id));
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
