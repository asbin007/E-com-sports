import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { envConfig } from "../../config/config.js";
import User from "../database/models/userModel.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: envConfig.client_id || "",
      clientSecret: envConfig.client_secret || "",
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ where: { googleId: profile.id } });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails?.[0]?.value;
        if (email) {
          user = await User.findOne({ where: { email } });
          if (user) {
            // Update existing user with googleId
            user.googleId = profile.id;
            if (!user.avatar && profile.photos?.[0]?.value) {
                user.avatar = profile.photos[0].value;
            }
             // Mark as verified if logging in via Google
             if (!user.isVerified) {
                user.isVerified = true;
            }
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        const newUser = await User.create({
          username: profile.displayName,
          email: email,
          googleId: profile.id,
          avatar: profile.photos?.[0]?.value,
          isVerified: true, // Google verified email
          role: "customer",
        });

        return done(null, newUser);
      } catch (error: any) {
        return done(error, false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
