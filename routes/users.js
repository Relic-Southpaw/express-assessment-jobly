"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureLoggedIn, isAdmin } = require("../middleware/auth");
const { BadRequestError, UnauthorizedError } = require("../expressError");
const User = require("../models/user");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNew.json");
const userUpdateSchema = require("../schemas/userUpdate.json");

const router = express.Router();


/** POST / { user }  => { user, token }
 *
 * Adds a new user. This is not the registration endpoint --- instead, this is
 * only for admin users to add new users. The new user being added can be an
 * admin.
 *
 * This returns the newly created user and an authentication token for them:
 *  {user: { username, firstName, lastName, email, isAdmin }, token }
 *
 * Authorization required: Admin
 **/

router.post("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: Admin
 **/

router.get("/", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, lastName, isAdmin }
 *
 * Authorization required: Admin or specific user
 **/

router.get("/:username", ensureLoggedIn, isAdmin, async function (req, res, next) {
  try {
    if (res.locals.user.username !== req.params.username) {
      if (res.locals.user.isAdmin === false) {
        throw new UnauthorizedError();
      }
    }
    const user = await User.get(req.params.username);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});


/** PATCH /[username] { user } => { user }
 *
 * Data can include:
 *   { firstName, lastName, password, email }
 *
 * Returns { username, firstName, lastName, email, isAdmin }
 *
 * Authorization required: Admin or specific user
 **/

router.patch("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    if (res.locals.user.username !== req.params.username) {
      if (res.locals.user.isAdmin === false) {
        throw new UnauthorizedError();
      }
    }
    const validator = jsonschema.validate(req.body, userUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.update(req.params.username, req.body);
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

/**POST to a specific user 
 * for a specific job by id
 * Returns a message showing that it was applied for
 * 
 * Auth required: Specific username in params or Admin.
 */
router.post("/:username/jobs/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    const q = req.params;
    if (res.locals.user.username !== q.username) {
      if (res.locals.user.isAdmin === false) {
        throw new UnauthorizedError();
      }
    }
    const jId = +q.id;
    await User.jobApply(q.username, jId);
    return res.json({ applied: jId })
  } catch (err) {
    return next(err);
  }
});


/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: Admin or specific user
 **/

router.delete("/:username", ensureLoggedIn, async function (req, res, next) {
  try {
    if (res.locals.user.username !== req.params.username) {
      if (res.locals.user.isAdmin === false) {
        throw new UnauthorizedError();
      }
    }
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;
