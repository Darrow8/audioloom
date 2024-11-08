import { Pod } from "@shared/pods";


export function isValidPod(pod: any): pod is Pod {
  if (typeof pod !== 'object' || pod === null) {
    return false;
  }

  if (!Array.isArray(pod.readings) || !Array.isArray(pod.audio)) {
    return false;
  }

  return true;
}
