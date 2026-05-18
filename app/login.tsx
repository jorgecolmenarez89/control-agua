import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { login as authLogin, register as authRegister } from '@/services/auth';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullnames, setFullnames] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (isRegistering && !fullnames.trim()) {
      Alert.alert('Error', 'Por favor ingresa tu nombre completo');
      return;
    }

    setIsLoading(true);
    try {
      let result;

      if (isRegistering) {
        // Registrar nuevo usuario
        result = await authRegister({
          username: username.trim(),
          password: password.trim(),
          fullnames: fullnames.trim(),
        });
      } else {
        // Iniciar sesión
        result = await authLogin({
          username: username.trim(),
          password: password.trim(),
        });
      }

      if (result.success && result.user && result.token && result.userId) {
        // Guardar sesión usando el contexto
        await login({
          token: result.token,
          userId: result.userId,
          userData: result.user,
        });
      } else {
        // Mostrar error
        Alert.alert('Error', result.error || 'Ocurrió un error');
      }
    } catch (error) {
      console.error('Error al procesar autenticación:', error);
      Alert.alert('Error', 'No se pudo completar la operación. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Control de Agua
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          Inicia sesión para continuar
        </ThemedText>

        <ThemedView style={styles.form}>
          <ThemedText style={styles.label}>Usuario</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: isDark ? '#2C2C2E' : '#fff',
                color: textColor,
                borderColor: isDark ? '#3A3A3C' : '#ddd',
              },
            ]}
            placeholder="nombre_usuario"
            placeholderTextColor={isDark ? '#8E8E93' : '#999'}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!isLoading}
          />

          {isRegistering && (
            <>
              <ThemedText style={styles.label}>Nombre completo</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#fff',
                    color: textColor,
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}
                placeholder="Juan Pérez"
                placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                value={fullnames}
                onChangeText={setFullnames}
                editable={!isLoading}
              />
            </>
          )}

          <ThemedText style={styles.label}>Contraseña</ThemedText>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  color: textColor,
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={isDark ? '#8E8E93' : '#999'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: tintColor },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading}>
            <ThemedText style={styles.buttonText}>
              {isLoading
                ? isRegistering
                  ? 'Registrando...'
                  : 'Iniciando sesión...'
                : isRegistering
                ? 'Registrarse'
                : 'Iniciar sesión'}
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setIsRegistering(!isRegistering)}
            disabled={isLoading}>
            <ThemedText style={styles.toggleButtonText}>
              {isRegistering
                ? '¿Ya tienes cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate'}
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.7,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 45,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 14,
    opacity: 0.7,
  },
});

