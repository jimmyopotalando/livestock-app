// PaymentStatusModal.js
import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../constants/theme';

/**
 * Props:
 * - visible (boolean)
 * - status: 'PENDING' | 'SUCCESS' | 'FAILED'
 * - message (string)
 * - amount (number)
 * - onRetry () → for retrying failed payments
 * - onClose () → closes the modal
 * - pendingPayments (array) → optional, shows multiple pending payments
 */
const PaymentStatusModal = ({
  visible,
  status = 'PENDING',
  message,
  amount = 100,
  onRetry,
  onClose,
  pendingPayments = [],
}) => {
  useEffect(() => {
    if (status === 'SUCCESS') {
      // Auto close after success (optional UX improvement)
      const timer = setTimeout(() => {
        onClose?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [status]);

  const renderIcon = () => {
    switch (status) {
      case 'SUCCESS':
        return <Text style={styles.icon}>✅</Text>;
      case 'FAILED':
        return <Text style={styles.icon}>❌</Text>;
      default:
        return <ActivityIndicator size="large" color={COLORS.primary} />;
    }
  };

  const renderTitle = () => {
    switch (status) {
      case 'SUCCESS':
        return 'Payment Successful';
      case 'FAILED':
        return 'Payment Failed';
      default:
        return pendingPayments.length
          ? 'Pending Payments Detected'
          : 'Processing Payment';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {renderIcon()}

          <Text style={styles.title}>{renderTitle()}</Text>

          {/* Show either single amount or list of pending payments */}
          {pendingPayments.length > 0 ? (
            pendingPayments.map((p, idx) => (
              <Text key={idx} style={styles.amount}>
                {p.animal_id} — KES {p.amount}
              </Text>
            ))
          ) : (
            <Text style={styles.amount}>KES {amount}</Text>
          )}

          <Text style={styles.message}>
            {message ||
              (status === 'PENDING'
                ? pendingPayments.length
                  ? `You have ${pendingPayments.length} pending payment(s). Please complete them before proceeding.`
                  : 'Waiting for Mpesa confirmation...'
                : status === 'SUCCESS'
                ? 'You may proceed.'
                : 'Transaction was not completed.')}
          </Text>

          {status === 'FAILED' && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.8}
            >
              <Text style={styles.retryText}>Retry Payment</Text>
            </TouchableOpacity>
          )}

          {status !== 'PENDING' && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '85%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 6,
  },
  icon: {
    fontSize: 42,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.black,
    marginBottom: 6,
    textAlign: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 8,
    marginBottom: 10,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeText: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PaymentStatusModal;
