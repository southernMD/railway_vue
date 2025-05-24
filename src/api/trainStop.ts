/*
 * @Description: create by southernMD
 */

import http from "@/utils/http"
import { Station } from "./station"

export interface TrainStop {
  id: number
  trainId: number
  station: Station
  departureTime: string
  sequence: number
  arrivalTime: string
  stopDuration: number
}
export const batchUpdateTrainStops = (trainStops: TrainStop[], trainId: number) => {
  return http.put('/train-stops/batch-update', {trainStops,trainId})
}

export default {
  batchUpdateTrainStops
}


