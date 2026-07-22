/** react-native-maps Region과 호환되는 공통 지도 영역 타입 (웹/네이티브 공용) */
export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};
