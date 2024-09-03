import { User, Pod } from './user';

// lax requirements for now
export function isValidMongoUser(obj: any): obj is User {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const requiredFields: (keyof User)[] = ['_id', 'name', 'pods', 'email', 'email_verified', 'created_at'];

  for (const field of requiredFields) {
    if (!(field in obj)) {
      return false;
    }
  }

  if (typeof obj._id !== 'string' || typeof obj.name !== 'string') {
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

  return true;
}
