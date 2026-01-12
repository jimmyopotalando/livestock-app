// ConfirmationScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Header from '../components/Header';
import Button from '../components/Button';
import { COLORS } from '../constants/theme';

const ConfirmationScreen = ({ route, navigation }) => {
  const {
    animalId,
    ownerId,
    ownerName,
    ownerPhone,
    ownerLocation,
    images = {}, // { front, back, left, right } with timestamp & gps
    offline = false,
  } = route.params || {};

  const renderThumbnail = (img, label) => {
    if (!img?.uri) return null;
    return (
      <View style={styles.thumbnailBox}>
        <Image source={{ uri: img.uri }} style={styles.thumbnail} />
        <View style={styles.overlay}>
          {img.timestamp && <Text style={styles.overlayText}>{img.timestamp}</Text>}
          {img.gps && <Text style={styles.overlayText}>{img.gps}</Text>}
        </View>
        <Text style={styles.thumbLabel}>{label}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Registration Successful!" showBack={false} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.successText}>Registration Successful!</Text>

        {offline && (
          <Text style={styles.offlineNote}>
            This registration was saved offline and will sync automatically when online.
          </Text>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.label}>Animal ID:</Text>
          <Text style={styles.value}>{animalId || 'Auto-generated'}</Text>

          <Text style={styles.label}>Owner ID:</Text>
          <Text style={styles.value}>{ownerId || 'N/A'}</Text>

          <Text style={styles.label}>Owner Name:</Text>
          <Text style={styles.value}>{ownerName || 'N/A'}</Text>

          <Text style={styles.label}>Owner Phone:</Text>
          <Text style={styles.value}>{ownerPhone || 'N/A'}</Text>

          <Text style={styles.label}>Owner Location:</Text>
          <Text style={styles.value}>{ownerLocation || 'N/A'}</Text>
        </View>

        {/* Thumbnails with timestamp & GPS */}
        <View style={styles.thumbnailsContainer}>
          {renderThumbnail(images.front, 'Front')}
          {renderThumbnail(images.back, 'Back')}
          {renderThumbnail(images.left, 'Left')}
          {renderThumbnail(images.right, 'Right')}
        </View>

        {/* Buttons */}
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate('Welcome')}
        />
        <Button
          title="Register Another Animal"
          onPress={() => navigation.navigate('Register')}
          style={{ backgroundColor: COLORS.secondary, marginTop: 12 }}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, flexGrow: 1, justifyContent: 'center' },
  successText: {
    fontSize: 22,
    color: COLORS.primary,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  offlineNote: {
    textAlign: 'center',
    color: 'orange',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 10,
    marginBottom: 24,
    elevation: 3,
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
  thumbnailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  thumbnailBox: {
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  overlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 2,
    borderRadius: 4,
  },
  overlayText: {
    fontSize: 10,
    color: '#fff',
    textAlign: 'center',
  },
  thumbLabel: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.gray,
  },
});

export default ConfirmationScreen;
