import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { createEmpresa, Empresa, getEmpresa, updateEmpresa } from '@/services/empresa';
import { createUser, deleteUser, getAllUsers, getRoles, updateUser } from '@/services/users';
import { User, UserRole } from '@/types/user';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type TabType = 'empresa' | 'usuarios';

export default function ConfiguracionScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('empresa');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estado para información de empresa
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [empresaForm, setEmpresaForm] = useState({
    nombre: '',
    rif: '',
    direccion: '',
    telefono: '',
    descripcion: '',
  });
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  // Estado para usuarios
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    correo: '',
    contrasena: '',
    idRol: null as number | null,
    activo: true,
  });
  const [savingUser, setSavingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const colorScheme = useColorScheme();
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      if (activeTab === 'empresa') {
        await loadEmpresa();
      } else {
        await loadUsers();
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const loadEmpresa = async () => {
    try {
      const data = await getEmpresa();
      if (data) {
        setEmpresa(data);
        setEmpresaForm({
          nombre: data.nombre || '',
          rif: data.rif || '',
          direccion: data.direccion || '',
          telefono: data.telefono || '',
          descripcion: data.descripcion || '',
        });
      } else {
        setEmpresa(null);
        setEmpresaForm({
          nombre: '',
          rif: '',
          direccion: '',
          telefono: '',
          descripcion: '',
        });
      }
    } catch (error) {
      console.error('Error al cargar empresa:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la empresa');
    }
  };

  const loadUsers = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([getAllUsers(), getRoles()]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleSaveEmpresa = async () => {
    if (!empresaForm.nombre.trim()) {
      Alert.alert('Error', 'El nombre de la empresa es requerido');
      return;
    }

    try {
      setSavingEmpresa(true);

      if (empresa) {
        await updateEmpresa(empresa.id || 1, {
          nombre: empresaForm.nombre.trim() || null,
          rif: empresaForm.rif.trim() || null,
          direccion: empresaForm.direccion.trim() || null,
          telefono: empresaForm.telefono.trim() || null,
          descripcion: empresaForm.descripcion.trim() || null,
        });
        Alert.alert('Éxito', 'Información de la empresa actualizada correctamente');
      } else {
        await createEmpresa({
          nombre: empresaForm.nombre.trim(),
          rif: empresaForm.rif.trim() || null,
          direccion: empresaForm.direccion.trim() || null,
          telefono: empresaForm.telefono.trim() || null,
          descripcion: empresaForm.descripcion.trim() || null,
        });
        Alert.alert('Éxito', 'Empresa creada correctamente');
      }

      await loadEmpresa();
    } catch (error: any) {
      console.error('Error al guardar empresa:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la información');
    } finally {
      setSavingEmpresa(false);
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.correo.trim()) {
      Alert.alert('Error', 'El correo es requerido');
      return;
    }

    if (!userForm.idRol) {
      Alert.alert('Error', 'Debe seleccionar un rol');
      return;
    }

    if (!userForm.contrasena.trim()) {
      Alert.alert('Error', 'La contraseña es requerida');
      return;
    }

    try {
      setSavingUser(true);
      if (editingUser) {
        await updateUser({
          id: editingUser.id,
          correo: userForm.correo.trim(),
          contrasena: userForm.contrasena.trim(),
          id_rol: userForm.idRol,
          activo: userForm.activo,
        });
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
      } else {
        await createUser({
          correo: userForm.correo.trim(),
          contrasena: userForm.contrasena.trim(),
          id_rol: userForm.idRol,
          activo: userForm.activo,
        });
        Alert.alert('Éxito', 'Usuario creado correctamente');
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ correo: '', contrasena: '', idRol: null, activo: true });
      await loadUsers();
    } catch (error: any) {
      console.error('Error al guardar usuario:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar el usuario');
    } finally {
      setSavingUser(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      correo: user.correo,
      contrasena: '',
      idRol: user.id_rol,
      activo: user.activo,
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de eliminar el usuario "${user.correo}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.id);
              Alert.alert('Éxito', 'Usuario eliminado correctamente');
              await loadUsers();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar el usuario');
            }
          },
        },
      ]
    );
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setUserForm({ correo: '', contrasena: '', idRol: null, activo: true });
    setShowUserForm(true);
  };

  if (isLoading && !empresa && activeTab === 'empresa') {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.loadingText}>Cargando...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            Configuración
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.tabs}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'empresa' && { backgroundColor: tintColor },
            ]}
            onPress={() => setActiveTab('empresa')}>
            <ThemedText
              style={[
                styles.tabText,
                activeTab === 'empresa' && styles.tabTextActive,
              ]}>
              Empresa
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'usuarios' && { backgroundColor: tintColor },
            ]}
            onPress={() => setActiveTab('usuarios')}>
            <ThemedText
              style={[
                styles.tabText,
                activeTab === 'usuarios' && styles.tabTextActive,
              ]}>
              Usuarios
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {activeTab === 'empresa' ? (
          <ThemedView style={styles.content}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Información de la Empresa
            </ThemedText>
            {!empresa && (
              <ThemedText style={styles.infoText}>
                Aún no hay empresa registrada. Completa el formulario para crearla.
              </ThemedText>
            )}

            <ThemedText style={styles.label}>Nombre de la Empresa *</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  color: textColor,
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              placeholder="Nombre de la empresa"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              value={empresaForm.nombre}
              onChangeText={(text) => setEmpresaForm({ ...empresaForm, nombre: text })}
            />

            <ThemedText style={styles.label}>RIF</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  color: textColor,
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              placeholder="RIF de la empresa"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              value={empresaForm.rif}
              onChangeText={(text) => setEmpresaForm({ ...empresaForm, rif: text })}
            />

            <ThemedText style={styles.label}>Dirección</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  color: textColor,
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              placeholder="Dirección"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              value={empresaForm.direccion}
              onChangeText={(text) => setEmpresaForm({ ...empresaForm, direccion: text })}
              multiline
              numberOfLines={3}
            />

            <ThemedText style={styles.label}>Teléfono</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  color: textColor,
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              placeholder="Teléfono"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              value={empresaForm.telefono}
              onChangeText={(text) => setEmpresaForm({ ...empresaForm, telefono: text })}
              keyboardType="phone-pad"
            />

            <ThemedText style={styles.label}>Descripción</ThemedText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: isDark ? '#2C2C2E' : '#fff',
                  color: textColor,
                  borderColor: isDark ? '#3A3A3C' : '#ddd',
                },
              ]}
              placeholder="Descripción de la empresa"
              placeholderTextColor={isDark ? '#8E8E93' : '#999'}
              value={empresaForm.descripcion}
              onChangeText={(text) => setEmpresaForm({ ...empresaForm, descripcion: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: tintColor },
                savingEmpresa && styles.buttonDisabled,
              ]}
              onPress={handleSaveEmpresa}
              disabled={savingEmpresa}>
              <ThemedText style={styles.saveButtonText}>
                {savingEmpresa
                  ? 'Guardando...'
                  : empresa
                    ? 'Guardar Información'
                    : 'Crear Empresa'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.content}>
            <ThemedView style={styles.usersHeader}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Gestión de Usuarios
              </ThemedText>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: tintColor }]}
                onPress={handleNewUser}>
                <Ionicons name="add" size={20} color="#fff" />
                <ThemedText style={styles.addButtonText}>Nuevo</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {showUserForm && (
              <ThemedView
                style={[
                  styles.userForm,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#fff',
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}>
                <ThemedText type="subtitle" style={styles.formTitle}>
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </ThemedText>

                <ThemedText style={styles.label}>Correo *</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
                      color: textColor,
                      borderColor: isDark ? '#3A3A3C' : '#ddd',
                    },
                  ]}
                  placeholder="correo@dominio.com"
                  placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                  value={userForm.correo}
                  onChangeText={(text) => setUserForm({ ...userForm, correo: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <ThemedText style={styles.label}>
                  Contraseña *
                </ThemedText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      {
                        backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
                        color: textColor,
                        borderColor: isDark ? '#3A3A3C' : '#ddd',
                      },
                    ]}
                    placeholder="Contraseña"
                    placeholderTextColor={isDark ? '#8E8E93' : '#999'}
                    value={userForm.contrasena}
                    onChangeText={(text) => setUserForm({ ...userForm, contrasena: text })}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={textColor}
                    />
                  </TouchableOpacity>
                </View>

                <ThemedText style={styles.label}>Rol *</ThemedText>
                <View
                  style={[
                    styles.pickerContainer,
                    {
                      backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
                      borderColor: isDark ? '#3A3A3C' : '#ddd',
                    },
                  ]}>
                  <Picker
                    selectedValue={userForm.idRol}
                    onValueChange={(value) => setUserForm({ ...userForm, idRol: value })}
                    style={{ color: textColor }}>
                    <Picker.Item label="Selecciona un rol" value={null} />
                    {roles.map((role) => (
                      <Picker.Item key={role.id} label={role.nombre} value={role.id} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.switchContainer}>
                  <ThemedText style={styles.label}>Activo</ThemedText>
                  <Switch
                    value={userForm.activo}
                    onValueChange={(value) => setUserForm({ ...userForm, activo: value })}
                    trackColor={{ false: '#767577', true: tintColor }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setShowUserForm(false);
                      setEditingUser(null);
                      setUserForm({ correo: '', contrasena: '', idRol: null, activo: true });
                    }}>
                    <ThemedText style={styles.cancelButtonText}>Cancelar</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      { backgroundColor: tintColor },
                      savingUser && styles.buttonDisabled,
                    ]}
                    onPress={handleSaveUser}
                    disabled={savingUser}>
                    <ThemedText style={styles.saveButtonText}>
                      {savingUser ? 'Guardando...' : 'Guardar'}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </ThemedView>
            )}

            {users.map((user) => (
              <ThemedView
                key={user.id}
                style={[
                  styles.userCard,
                  {
                    backgroundColor: isDark ? '#2C2C2E' : '#fff',
                    borderColor: isDark ? '#3A3A3C' : '#ddd',
                  },
                ]}>
                <ThemedView style={styles.userInfo}>
                  <ThemedText style={styles.userName}>{user.correo}</ThemedText>
                  <ThemedText style={styles.userFullname}>
                    Rol: {user.rol?.nombre || `ID ${user.id_rol}`}
                  </ThemedText>
                  <ThemedText style={styles.userFullname}>
                    Estado: {user.activo ? 'Activo' : 'Inactivo'}
                  </ThemedText>
                </ThemedView>
                <ThemedView style={styles.userActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditUser(user)}>
                    <Ionicons name="pencil" size={20} color={tintColor} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteUser(user)}>
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </ThemedView>
              </ThemedView>
            ))}

            {users.length === 0 && !showUserForm && (
              <ThemedView style={styles.emptyContainer}>
                <ThemedText style={styles.emptyText}>No hay usuarios registrados</ThemedText>
              </ThemedView>
            )}
          </ThemedView>
        )}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 13,
    opacity: 0.75,
    marginTop: 6,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    minHeight: 52,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  usersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  userForm: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  formTitle: {
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    alignItems: 'stretch',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    minHeight: 52,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userFullname: {
    fontSize: 14,
    opacity: 0.7,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
