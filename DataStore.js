import React, { AsyncStorage } from 'react-native';

class DataStore {
  async harvestCountForDate(dateAtMidnight) {
    let dateStr = dateAtMidnight.toString();
    let harvestForDate = await AsyncStorage.getItem(dateStr);

    if (harvestForDate) {
      return parseInt(harvestForDate, 10);
    } else {
      return 0;
    }
  }

  async incrementHarvest(dateAtMidnight) {
    let dateStr = dateAtMidnight.toString();
    let harvestForDate = await AsyncStorage.getItem(dateStr);
    harvestForDate = harvestForDate ? parseInt(harvestForDate, 10) + 1 : 1;
    await AsyncStorage.setItem(dateStr, harvestForDate.toString());
  }

}

export default new DataStore();
