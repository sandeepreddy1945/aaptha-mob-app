import { AppButton, AppCard, AppPage, Divider, RowIcon, SectionHeading } from '@/components/app/ui';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { Uniwind } from 'uniwind';
import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  Bell,
  Camera,
  ChevronRight,
  CircleHelp,
  Fingerprint,
  HeartHandshake,
  LockKeyhole,
  LogOut,
  Mail,
  MapPin,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  Trash2,
  UserRound,
  X,
} from 'lucide-react-native';

type ProfileFieldKey = 'name' | 'email' | 'phone' | 'address';
type ProfileData = Record<ProfileFieldKey, string> & { employeeId: string };
type EmergencyContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
};
type ContactDraft = Omit<EmergencyContact, 'id'>;
type EditableField = { key: ProfileFieldKey; label: string; value: string };

const INITIAL_PROFILE: ProfileData = {
  name: 'Asha Sharma',
  employeeId: 'AAP-1048',
  email: 'asha@example.com',
  phone: 'Not added',
  address: 'Not added',
};

const EMPTY_CONTACT: ContactDraft = {
  name: '',
  relationship: '',
  phone: '',
  email: '',
};

function FieldRow({
  icon: Icon,
  label,
  value,
  onPress,
}: {
  icon: typeof UserRound;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const content = (
    <View className="flex-row items-center gap-3 py-4">
      <Icon color="#667085" size={20} />
      <View className="flex-1">
        <Text className="text-muted-foreground text-xs font-semibold">{label}</Text>
        <Text className="text-foreground mt-1 text-sm font-medium">{value}</Text>
      </View>
      {onPress ? <ChevronRight color="#98a2b3" size={18} /> : null}
    </View>
  );

  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactDraft, setContactDraft] = useState<ContactDraft>(EMPTY_CONTACT);
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const [themeChoice, setThemeChoice] = useState<'system' | 'light' | 'dark'>('system');

  const openFieldEditor = (key: ProfileFieldKey, label: string) => {
    setEditingField({ key, label, value: profile[key] });
    setFieldDraft(profile[key] === 'Not added' ? '' : profile[key]);
  };

  const saveProfileField = () => {
    if (!editingField) return;
    const value = fieldDraft.trim();
    if (!value) {
      Alert.alert('Enter a value', `${editingField.label} cannot be empty.`);
      return;
    }
    setProfile((current) => ({ ...current, [editingField.key]: value }));
    setEditingField(null);
  };

  const openContactEditor = (contact?: EmergencyContact) => {
    setEditingContactId(contact?.id ?? null);
    setContactDraft(
      contact
        ? {
            name: contact.name,
            relationship: contact.relationship,
            phone: contact.phone,
            email: contact.email,
          }
        : EMPTY_CONTACT
    );
    setIsContactModalVisible(true);
  };

  const saveContact = () => {
    if (
      !contactDraft.name.trim() ||
      !contactDraft.relationship.trim() ||
      !contactDraft.phone.trim()
    ) {
      Alert.alert('Contact details needed', 'Add a name, relationship, and phone number.');
      return;
    }

    if (editingContactId) {
      setContacts((current) =>
        current.map((contact) =>
          contact.id === editingContactId
            ? { ...contact, ...contactDraft, name: contactDraft.name.trim() }
            : contact
        )
      );
    } else {
      if (contacts.length >= 3) {
        Alert.alert('Contact limit reached', 'You can add up to three emergency contacts.');
        return;
      }
      setContacts((current) => [
        ...current,
        { ...contactDraft, id: `${Date.now()}`, name: contactDraft.name.trim() },
      ]);
    }
    setEditingContactId(null);
    setContactDraft(EMPTY_CONTACT);
    setIsContactModalVisible(false);
  };

  const moveContact = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    setContacts((current) => {
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
  };

  const removeContact = (contact: EmergencyContact) => {
    Alert.alert('Remove emergency contact?', `${contact.name} will be removed from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setContacts((current) => current.filter((item) => item.id !== contact.id)),
      },
    ]);
  };

  const selectTheme = (choice: 'system' | 'light' | 'dark') => {
    setThemeChoice(choice);
    Uniwind.setTheme(choice);
  };

  const notConnected = (feature: string) =>
    Alert.alert(
      feature,
      'This setting is a preview and is not connected to an account service yet.'
    );

  return (
    <AppPage>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-foreground text-3xl font-extrabold">My profile</Text>
          <Text className="text-muted-foreground mt-1 text-base">
            Your details and preferences.
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900">
          <UserRound color="#047857" size={23} />
        </View>
      </View>

      <AppCard className="mt-6">
        <View className="items-center">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
            <Text className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100">
              AS
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            className="bg-secondary mt-3 flex-row items-center gap-2 rounded-full px-4 py-2"
            onPress={() => notConnected('Profile photo')}>
            <Camera color="#344054" size={16} />
            <Text className="text-foreground text-sm font-semibold">Change photo</Text>
          </Pressable>
          <Text className="text-foreground mt-4 text-xl font-extrabold">{profile.name}</Text>
          <Text className="text-muted-foreground mt-1 text-sm">Caregiver · Demo employee</Text>
          <View className="mt-3 rounded-full bg-emerald-50 px-3 py-1 dark:bg-emerald-950">
            <Text className="text-xs font-bold text-emerald-800 dark:text-emerald-200">
              EMPLOYEE ID · {profile.employeeId}
            </Text>
          </View>
        </View>
      </AppCard>

      <SectionHeading
        title="Personal information"
        detail="Tap a detail to edit it on this device."
      />
      <AppCard className="gap-1 py-1">
        <FieldRow
          icon={UserRound}
          label="Full name"
          value={profile.name}
          onPress={() => openFieldEditor('name', 'Full name')}
        />
        <Divider />
        <FieldRow
          icon={Mail}
          label="Email address"
          value={profile.email}
          onPress={() => openFieldEditor('email', 'Email address')}
        />
        <Divider />
        <FieldRow
          icon={Phone}
          label="Phone number"
          value={profile.phone}
          onPress={() => openFieldEditor('phone', 'Phone number')}
        />
        <Divider />
        <FieldRow
          icon={MapPin}
          label="Residential address"
          value={profile.address}
          onPress={() => openFieldEditor('address', 'Residential address')}
        />
        <Divider />
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            Alert.alert(
              'Aadhaar is protected',
              'Only a masked placeholder is shown. Secure storage and biometric re-authentication are not connected in this preview.'
            )
          }>
          <FieldRow
            icon={LockKeyhole}
            label="Aadhaar number"
            value="XXXX-XXXX-XXXX · Masked"
            onPress={() => undefined}
          />
        </Pressable>
        <Divider />
        <FieldRow icon={ShieldCheck} label="Employee ID" value={profile.employeeId} />
      </AppCard>

      <SectionHeading
        title="Emergency contacts"
        detail="Ordered by priority. The first contact is primary for SOS escalation."
      />
      <AppCard className="gap-4">
        {contacts.length === 0 ? (
          <View className="items-center py-3">
            <RowIcon icon={HeartHandshake} tone="amber" />
            <Text className="text-foreground mt-3 text-base font-bold">Add a trusted contact</Text>
            <Text className="text-muted-foreground mt-1 text-center text-sm leading-5">
              Add at least one emergency contact so your safety details are ready.
            </Text>
          </View>
        ) : (
          contacts.map((contact, index) => (
            <View key={contact.id} className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                <Text className="font-bold text-rose-800 dark:text-rose-200">
                  {contact.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </Text>
              </View>
              <Pressable className="flex-1" onPress={() => openContactEditor(contact)}>
                <View className="flex-row items-center gap-2">
                  <Text className="text-foreground font-bold">{contact.name}</Text>
                  {index === 0 ? (
                    <Text className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                      PRIMARY
                    </Text>
                  ) : null}
                </View>
                <Text className="text-muted-foreground mt-1 text-xs">
                  {contact.relationship} · {contact.phone}
                </Text>
              </Pressable>
              <View className="flex-row">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${contact.name} up`}
                  className="h-10 w-9 items-center justify-center"
                  disabled={index === 0}
                  onPress={() => moveContact(index, -1)}>
                  <ArrowUp color={index === 0 ? '#cbd5e1' : '#667085'} size={18} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Move ${contact.name} down`}
                  className="h-10 w-9 items-center justify-center"
                  disabled={index === contacts.length - 1}
                  onPress={() => moveContact(index, 1)}>
                  <ArrowDown
                    color={index === contacts.length - 1 ? '#cbd5e1' : '#667085'}
                    size={18}
                  />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${contact.name}`}
                  className="h-10 w-9 items-center justify-center"
                  onPress={() => removeContact(contact)}>
                  <Trash2 color="#be123c" size={17} />
                </Pressable>
              </View>
            </View>
          ))
        )}
        <AppButton
          disabled={contacts.length >= 3}
          label={contacts.length === 0 ? 'Add emergency contact' : 'Add another contact'}
          onPress={() => openContactEditor()}
          variant="outline"
        />
        {contacts.length > 0 ? (
          <Text className="text-muted-foreground text-center text-xs">
            Contact details are a local preview and are not sent to a dispatch service.
          </Text>
        ) : null}
      </AppCard>

      <SectionHeading title="Appearance" detail="Choose how Aaptha Care looks on this device." />
      <AppCard className="gap-4">
        <View className="flex-row items-center gap-3">
          <RowIcon icon={Sun} tone="amber" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">App theme</Text>
            <Text className="text-muted-foreground mt-1 text-sm">
              Light, dark, or follow your device.
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          {(
            [
              ['system', 'System', UserRound],
              ['light', 'Light', Sun],
              ['dark', 'Dark', Moon],
            ] as const
          ).map(([choice, label, Icon]) => (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: themeChoice === choice }}
              className={`min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border ${themeChoice === choice ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950' : 'border-border bg-background'}`}
              key={choice}
              onPress={() => selectTheme(choice)}>
              <Icon color={themeChoice === choice ? '#047857' : '#667085'} size={17} />
              <Text
                className={`text-sm font-semibold ${themeChoice === choice ? 'text-emerald-800 dark:text-emerald-200' : 'text-foreground'}`}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </AppCard>

      <SectionHeading title="Help and security" />
      <AppCard className="gap-1 py-1">
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-3 py-4"
          onPress={() => router.push('/chat' as Href)}>
          <RowIcon icon={CircleHelp} tone="violet" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">Ask Aaptha AI</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              Questions about shifts, HR, and care
            </Text>
          </View>
          <ChevronRight color="#98a2b3" size={18} />
        </Pressable>
        <Divider />
        <Pressable
          className="flex-row items-center gap-3 py-4"
          onPress={() => notConnected('Biometric lock')}>
          <RowIcon icon={Fingerprint} tone="blue" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">Biometric app lock</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              Set up an additional privacy lock
            </Text>
          </View>
          <ChevronRight color="#98a2b3" size={18} />
        </Pressable>
        <Divider />
        <Pressable
          className="flex-row items-center gap-3 py-4"
          onPress={() => notConnected('Change password')}>
          <RowIcon icon={LockKeyhole} tone="blue" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">Change password</Text>
            <Text className="text-muted-foreground mt-1 text-xs">Manage your sign-in security</Text>
          </View>
          <ChevronRight color="#98a2b3" size={18} />
        </Pressable>
        <Divider />
        <Pressable
          className="flex-row items-center gap-3 py-4"
          onPress={() => notConnected('Notification settings')}>
          <RowIcon icon={Bell} tone="amber" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">Notification settings</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              Quiet hours and update categories
            </Text>
          </View>
          <ChevronRight color="#98a2b3" size={18} />
        </Pressable>
        <Divider />
        <Pressable
          className="flex-row items-center gap-3 py-4"
          onPress={() => notConnected('Sign out')}>
          <RowIcon icon={LogOut} tone="rose" />
          <View className="flex-1">
            <Text className="text-foreground font-bold">Sign out</Text>
            <Text className="text-muted-foreground mt-1 text-xs">
              End this session on this device
            </Text>
          </View>
          <ChevronRight color="#98a2b3" size={18} />
        </Pressable>
      </AppCard>
      <Text className="text-muted-foreground mt-4 text-center text-xs">
        Profile fields and contacts are preview-only and are not synced to an account.
      </Text>

      <Modal
        animationType="slide"
        onRequestClose={() => setEditingField(null)}
        transparent
        visible={editingField !== null}>
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-background rounded-t-3xl p-6">
              <View className="mb-5 flex-row items-center justify-between">
                <Text className="text-foreground text-xl font-bold">
                  Edit {editingField?.label}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setEditingField(null)}>
                  <X color="#667085" size={24} />
                </Pressable>
              </View>
              <Input
                autoCapitalize={editingField?.key === 'email' ? 'none' : 'words'}
                autoFocus
                className="min-h-14 rounded-2xl px-4"
                keyboardType={
                  editingField?.key === 'email'
                    ? 'email-address'
                    : editingField?.key === 'phone'
                      ? 'phone-pad'
                      : 'default'
                }
                onChangeText={setFieldDraft}
                placeholder={editingField?.label}
                value={fieldDraft}
              />
              <View className="mt-4">
                <AppButton label="Save on this device" onPress={saveProfileField} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setEditingContactId(null);
          setContactDraft(EMPTY_CONTACT);
          setIsContactModalVisible(false);
        }}
        transparent
        visible={isContactModalVisible}>
        <View className="flex-1 justify-end bg-black/40">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View className="bg-background rounded-t-3xl p-6">
              <View className="mb-5 flex-row items-center justify-between">
                <Text className="text-foreground text-xl font-bold">
                  {editingContactId ? 'Edit contact' : 'New emergency contact'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => {
                    setEditingContactId(null);
                    setContactDraft(EMPTY_CONTACT);
                    setIsContactModalVisible(false);
                  }}>
                  <X color="#667085" size={24} />
                </Pressable>
              </View>
              <View className="gap-3">
                <TextInput
                  className="border-border bg-card text-foreground min-h-12 rounded-xl border px-4"
                  onChangeText={(name) => setContactDraft((current) => ({ ...current, name }))}
                  placeholder="Full name"
                  value={contactDraft.name}
                />
                <TextInput
                  className="border-border bg-card text-foreground min-h-12 rounded-xl border px-4"
                  onChangeText={(relationship) =>
                    setContactDraft((current) => ({ ...current, relationship }))
                  }
                  placeholder="Relationship"
                  value={contactDraft.relationship}
                />
                <TextInput
                  className="border-border bg-card text-foreground min-h-12 rounded-xl border px-4"
                  keyboardType="phone-pad"
                  onChangeText={(phone) => setContactDraft((current) => ({ ...current, phone }))}
                  placeholder="Phone number"
                  value={contactDraft.phone}
                />
                <TextInput
                  className="border-border bg-card text-foreground min-h-12 rounded-xl border px-4"
                  keyboardType="email-address"
                  onChangeText={(email) => setContactDraft((current) => ({ ...current, email }))}
                  placeholder="Email (optional)"
                  value={contactDraft.email}
                />
              </View>
              <View className="mt-4">
                <AppButton label="Save contact" onPress={saveContact} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </AppPage>
  );
}
