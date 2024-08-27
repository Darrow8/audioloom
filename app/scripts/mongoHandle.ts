import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import { isValidMongoUser } from './validateData';
import { makeAuthenticatedRequest } from './mongoSecurity';

/**
 * Fetches all records from the database.
 *
 * @returns {Promise<any[]>} A promise that resolves to an array of all records.
 * @throws Will throw an error if the request fails.
 */
export async function getAllRecords(): Promise<any[]> {
  try {
    const records = await makeAuthenticatedRequest();
    console.log(`Successfully fetched ${records.length} records`);
    return records;
  } catch (error) {
    console.error('Error fetching all records:', error);
    Alert.alert('Error', 'Failed to fetch records. Please try again later.');
    throw error;
  }
}

/**
 * Fetches a single record by its ID.
 *
 * @param {string} collection - The collection name.
 * @param {string} id - The ID of the record to fetch.
 * @returns {Promise<any>} A promise that resolves to the record object.
 * @throws Will throw an error if the request fails or the record is not found.
 */
export async function getRecordById(collection: string, id: string): Promise<any> {
  try {
    const record = await makeAuthenticatedRequest(`${collection}/${id}`);
    console.log(`Successfully fetched record with ID ${id} from collection ${collection}`);
    return record;
  } catch (error) {
    console.error(`Error fetching record with ID ${id} from collection ${collection}:`, error);
    Alert.alert('Error', `Failed to fetch record from ${collection}. Please try again later.`);
    return false;
  }
}

/**
 * Creates a new record in the database.
 *
 * @param {any} obj - The object to be created.
 * @param {string} collection - The collection name.
 * @returns {Promise<void>} A promise that resolves when the record is successfully created.
 * @throws Will throw an error if the request fails.
 */
export async function createRecord(collection: string, obj: any): Promise<void> {
  try {
    await makeAuthenticatedRequest(`${collection}`, 'POST', obj);
    console.log(`Successfully created new record in collection ${collection}`);
  } catch (error) {
    console.error(`Error creating new record in collection ${collection}:`, error);
    Alert.alert('Error', `Failed to create record in ${collection}. Please try again later.`);
    throw error;
  }
}

/**
 * Updates an existing record in the database by its ID.
 *
 * @param {string} id - The ID of the record to update.
 * @param {any} obj - The updated object.
 * @param {string} collection - The collection name.
 * @returns {Promise<void>} A promise that resolves when the record is successfully updated.
 * @throws Will throw an error if the request fails.
 */
export async function updateRecord(collection: string, id: string, obj: any): Promise<void> {
  try {
    await makeAuthenticatedRequest(`${collection}/${id}`, 'PATCH', obj);
    console.log(`Successfully updated record with ID ${id} in collection ${collection}`);
  } catch (error) {
    console.error(`Error updating record with ID ${id} in collection ${collection}:`, error);
    Alert.alert('Error', `Failed to update record in ${collection}. Please try again later.`);
    throw error;
  }
}

/**
 * Deletes a record from the database by its ID.
 *
 * @param {string} id - The ID of the record to delete.
 * @param {string} collection - The collection name.
 * @returns {Promise<void>} A promise that resolves when the record is successfully deleted.
 * @throws Will throw an error if the request fails.
 */
export async function deleteRecord(collection: string, id: string): Promise<void> {
  try {
    await makeAuthenticatedRequest(`${collection}/${id}`, 'DELETE');
    console.log(`Successfully deleted record with ID ${id} from collection ${collection}`);
  } catch (error) {
    console.error(`Error deleting record with ID ${id} from collection ${collection}:`, error);
    Alert.alert('Error', `Failed to delete record from ${collection}. Please try again later.`);
    throw error;
  }
}