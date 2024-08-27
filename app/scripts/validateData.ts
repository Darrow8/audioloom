import { MongoUser, Pod } from './user';

export function isValidMongoUser(obj: any): obj is MongoUser {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const requiredFields: (keyof MongoUser)[] = ['_id', 'name', 'pods', 'user_id'];

  for (const field of requiredFields) {
    if (!(field in obj)) {
      return false;
    }
  }

  if (typeof obj._id !== 'string' || typeof obj.name !== 'string' || typeof obj.user_id !== 'string') {
    return false;
  }

  if (!Array.isArray(obj.pods)) {
    return false;
  }

  for (const pod of obj.pods) {
    if (!isValidPod(pod)) {
      return false;
    }
  }

  return true;
}

export function isValidPod(pod: any): pod is Pod {
  if (typeof pod !== 'object' || pod === null) {
    return false;
  }

  if (!Array.isArray(pod.readings) || !Array.isArray(pod.audio)) {
    return false;
  }

  if (!pod.readings.every((reading: any) => typeof reading === 'string')) {
    return false;
  }

  if (!pod.audio.every((audio: any) => typeof audio === 'string')) {
    return false;
  }

  return true;
}
