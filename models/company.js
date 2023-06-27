"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [
        handle,
        name,
        description,
        numEmployees,
        logoUrl,
      ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll(filters = {}) {
    const { minEmployees, maxEmployees, name } = filters;
    let query = "WHERE"
    let secSlot = 1;
    let vars = [];
    // the if statements check the query filters, and if they're there
    // it writes the SQL
    // if more than one are passed it adds them together to the SQL query
    // and adds them to the vars list to add at the end to use 
    // the $1,$2,$3 for security
    if (minEmployees !== undefined) {
      query += ` num_employees >= $${secSlot}`;
      secSlot += 1;
      vars.push(minEmployees);
    }
    if (maxEmployees !== undefined) {
      if (query !== "WHERE") {
        query += `AND num_employees <= $${secSlot}`;
        secSlot += 1;
        vars.push(maxEmployees)
      } else {
        query += ` num_employees <= $${secSlot}`;
        secSlot += 1;
        vars.push(maxEmployees)
      }
    }
    if (name) {
      S
      if (query !== "WHERE") {
        query += `AND UPPER name LIKE UPPER $${secSlot}`
        vars.push(name)
      } else {
        query += ` UPPER name LIKE UPPER ${secSlot}`
        vars.push(name)
      }
    }
    if (query === "WHERE") {
      query = " "
    }
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies ${query}
            ORDER BY name`, vars);
    console.log(companiesRes)
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    /**
     * Added this section to look for jobs within the company
     * it searches through jobs where company handle is the same as what the get
     * request is, then it returns all rows of jobs with the handle
     * then the company.jobs = jobs.rows attaches all the jobs to that company
     * so the return value has the job(s) included.
     */
    const jobs = await db.query(
      `SELECT 
      id, 
      title, 
      salary, 
      equity
      FROM jobs
      WHERE company_handle = $1
      ORDER by id`, [handle]
    )

    company.jobs = jobs.rows;

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
      data,
      {
        numEmployees: "num_employees",
        logoUrl: "logo_url",
      });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
