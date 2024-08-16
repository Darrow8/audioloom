import axios from 'axios';

const BASE_URL = 'http://localhost:3000/records';

/**
 * Fetches all records from the database.
 *
 * @returns {Promise<any[]>} A promise that resolves to an array of all records.
 * @throws Will throw an error if the request fails.
 */
export async function getAllRecords(): Promise<any[]> {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error('Error fetching all records:', error);
    throw error;
  }
}

/**
 * Fetches a single record by its ID.
 *
 * @param {string} id - The ID of the record to fetch.
 * @returns {Promise<any>} A promise that resolves to the record object.
 * @throws Will throw an error if the request fails or the record is not found.
 */
export async function getRecordById(collection: string, id: string): Promise<any> {
  try {
    const response = await axios.get(`${BASE_URL}/${collection}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching record with ID ${id}:`, error);
    // throw error;
    return false;
  }
}

/**
 * Creates a new record in the database.
 *
 * @param {any} obj
 * @returns {Promise<void>} A promise that resolves when the record is successfully created.
 * @throws Will throw an error if the request fails.
 */
export async function createRecord(obj: any, collection: string): Promise<void> {
  try {
    await axios.post(`${BASE_URL}/${collection}`, obj);
  } catch (error) {
    console.error('Error creating new record:', error);
    throw error;
  }
}

/**
 * Updates an existing record in the database by its ID.
 *
 * @param {string} id - The ID of the record to update.
 * @param {any} obj 
 * @returns {Promise<void>} A promise that resolves when the record is successfully updated.
 * @throws Will throw an error if the request fails.
 */
export async function updateRecord(id: string, obj:any, collection: string): Promise<void> {
  try {
    await axios.patch(`${BASE_URL}/${collection}/${id}`, obj);
  } catch (error) {
    console.error(`Error updating record with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a record from the database by its ID.
 *
 * @param {string} id - The ID of the record to delete.
 * @returns {Promise<void>} A promise that resolves when the record is successfully deleted.
 * @throws Will throw an error if the request fails.
 */
export async function deleteRecord(id: string, collection:string): Promise<void> {
  try {
    await axios.delete(`${BASE_URL}/${collection}/${id}`);
  } catch (error) {
    console.error(`Error deleting record with ID ${id}:`, error);
    throw error;
  }
}