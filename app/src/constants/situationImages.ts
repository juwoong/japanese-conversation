import { ImageSourcePropType } from "react-native";

/** Static require map — Expo/Metro needs literal require() calls. */
const situationImages: Record<string, ImageSourcePropType> = {
  convenience_store: require("../../assets/situations/convenience_store.png"),
  cafe: require("../../assets/situations/cafe.png"),
  restaurant: require("../../assets/situations/restaurant.png"),
  train_station: require("../../assets/situations/train_station.png"),
  ask_directions: require("../../assets/situations/ask_directions.png"),
  hotel_checkin: require("../../assets/situations/hotel_checkin.png"),
  taxi: require("../../assets/situations/taxi.png"),
  airport_pickup: require("../../assets/situations/airport_pickup.png"),
  business_card: require("../../assets/situations/business_card.png"),
  office_guide: require("../../assets/situations/office_guide.png"),
  business_taxi: require("../../assets/situations/business_taxi.png"),
  meeting_response: require("../../assets/situations/meeting_response.png"),
  business_dinner: require("../../assets/situations/business_dinner.png"),
  farewell: require("../../assets/situations/farewell.png"),
  supermarket: require("../../assets/situations/supermarket.png"),
  neighbor_greeting: require("../../assets/situations/neighbor_greeting.png"),
  post_office: require("../../assets/situations/post_office.png"),
  phone_contract: require("../../assets/situations/phone_contract.png"),
  hospital: require("../../assets/situations/hospital.png"),
  bank_account: require("../../assets/situations/bank_account.png"),
  real_estate: require("../../assets/situations/real_estate.png"),
  part_time_interview: require("../../assets/situations/part_time_interview.png"),
};

export function getSituationImage(slug: string): ImageSourcePropType | undefined {
  return situationImages[slug];
}
