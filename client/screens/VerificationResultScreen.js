// VerificationResultScreen.js
import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';

const VerificationResultScreen = ({ route, navigation }) => {
  const {
    animalId,
    ownerId,
    ownerName,
    ownerPhone,
    ownerLocation,
    images,      // { front, back, left, right } URLs
    hints = [],  // optional hints/warnings from server
  } = route.params || {};

  return (
    <View style={styles.container}>
      <Header title="Animal Verified" showBack={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.successText}>✅ Animal Match Found</Text>

        {hints.length > 0 && (
          <View style={styles.hintsBox}>
            {hints.map((hint, i) => (
              <Text key={i} style={styles.hintText}>⚠ {hint}</Text>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.label}>Animal ID:</Text>
          <Text style={styles.value}>{animalId}</Text>

          <Text style={styles.label}>Owner ID:</Text>
          <Text style={styles.value}>{ownerId}</Text>

          <Text style={styles.label}>Owner Name:</Text>
          <Text style={styles.value}>{ownerName}</Text>

          <Text style={styles.label}>Owner Phone:</Text>
          <Text style={styles.value}>{ownerPhone}</Text>

          <Text style={styles.label}>Owner Location:</Text>
          <Text style={styles.value}>{ownerLocation}</Text>
        </View>

        {images && (
          <View style={styles.imagesRow}>
            {['front', 'back', 'left', 'right'].map((side) => (
              images[side] ? (
                <View key={side} style={styles.thumbContainer}>
                  <Image source={{ uri: images[side].uri }} style={styles.thumbnail} />
                  <Text style={styles.thumbLabel}>{side.charAt(0).toUpperCase() + side.slice(1)}</Text>
                </View>
              ) : null
            ))}
          </View>
        )}

        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('Welcome')}
        />

        <Button
          title="Verify Another"
          onPress={() => navigation.navigate('Verify')}
          style={{ backgroundColor: COLORS.secondary, marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  successText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  hintsBox: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    width: '100%',
  },
  hintText: {
    color: '#856404',
    fontSize: 14,
    marginVertical: 2,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: COLORS.black,
  },
  imagesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  thumbContainer: {
    alignItems: 'center',
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  thumbLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
  },
});

export default VerificationResultScreen;
