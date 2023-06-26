"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

// Related functions for jobs

class Job {
    //Create a job from data, update db, return new job data

    //data should be {title, salary, equity, companyHandle}

    // returns {id, title, salary, equity, companyHandle}

    static async create({ title, salary, equity, companyHandle }) {
        const res = await db.query(
            `INSERT INTO jobs
            (title, salary, equity, company_handle) 
            Values ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
            [
                title,
                salary,
                equity,
                companyHandle,
            ]);
        const job = res.rows[0];
        return job;
    }

    static async findAll(filters = {}) {
        const { title, minSalary, hasEquity } = filters;
        let query = "WHERE"
        let secSlot = 1;
        let vars = [];
        // the if statements check the query filters, and if they're there
        // it writes the SQL
        // if more than one are passed it adds them together to the SQL query
        // and adds them to the vars list to add at the end to use 
        // the $1,$2 for security
        if (title !== undefined) {
            query += ` UPPER title LIKE UPPER $${secSlot}`;
            secSlot += 1;
            vars.push(title);
        }
        if (minSalary !== undefined) {
            if (query !== "WHERE") {
                query += `AND salary >= $${secSlot}`;
                secSlot += 1;
                vars.push(minSalary)
            } else {
                query += ` salary >= $${secSlot}`;
                secSlot += 1;
                vars.push(minSalary)
            }
        }
        if (hasEquity === true) {
            if (query !== "WHERE") {
                query += `AND equity > 0`
            } else {
                query += ` equity > 0`
            }
        }
        if (query === "WHERE") {
            query = " "
        }
        const jobsRes = await db.query(
            `SELECT jobs.id,
                    jobs.title,
                    jobs.salary,
                    jobs.equity,
                    jobs.company_handle AS "companyHandle",
                    companies.name AS "companyName"
                    FROM jobs
                    LEFT JOIN companies ON companies.handle = jobs.company_handle
                     ${query} ORDER BY title`, vars);
        console.log(jobsRes)
        return jobsRes.rows;
    }

    static async get(id) {
        const res = await db.query(
            `SELECT
             id,
             title,
             salary,
             equity,
             company_handle AS "companyHandle"
             FROM
             jobs
             WHERE id = $1`, [id]
        );
        if (!res.rows[0]) {
            throw new NotFoundError(`Could not find job with ID of ${id}`)
        }
        return res.rows[0];
    }

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs 
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING id, 
                                    title, 
                                    salary, 
                                    equity,
                                    company_handle AS "companyHandle"`;
        const res = await db.query(querySql, [...values, id]);

        if (!res.rows[0]) throw new NotFoundError(`No job with ID of ${id}`);

        return res.rows[0];
    }

    static async remove(id) {
        const res = await db.query(
            `DELETE
               FROM jobs
               WHERE id = $1
               RETURNING id`, [id]);
        if (!res.rows[0]) throw new NotFoundError(`No job with ID of ${id}`);
    }
}

module.exports = Job;
