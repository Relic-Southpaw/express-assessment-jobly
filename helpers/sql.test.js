const { sqlForPartialUpdate } = require("./sql");
const {
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../expressError");
const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
} = require("../models/_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);


//this tests the partial update with updating the name of specific user1
describe("sqlForPartialUpdate", function () {
    const dataToUpdate = { "firstName": "Rob", "lastName": "Smith IV" };
    const jsToSql = { "firstName": "first_name", "lastName": "last_name", "isAdmin": "is_admin" };
    test("partial update", async function () {
        let partial = await sqlForPartialUpdate(dataToUpdate, jsToSql);
        expect(partial).toEqual({
            setCols: '"first_name"=$1, "last_name"=$2',
            values: ['Rob', 'Smith IV']
        })
    })
})