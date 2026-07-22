import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuideCategoryAddModal } from '@/components/guides/GuideCategoryAddModal';
import { GuideCategoryManageModal } from '@/components/guides/GuideCategoryManageModal';
import {
  buildGuideTextStyle,
  GuideTypographyToolbar,
} from '@/components/guides/GuideTypographyToolbar';
import { SegmentControl } from '@/components/SegmentControl';
import { GUIDE_SEVERITY_OPTIONS, type GuideSeverity } from '@/constants/guideSeverity';
import {
  DEFAULT_GUIDE_FONT_ID,
  DEFAULT_GUIDE_FONT_SIZE,
  getGuideTitleFontSize,
  type GuideFontSize,
} from '@/constants/guideFonts';
import { resolveGuideIcon } from '@/constants/guideIcons';
import { useGuideFont, useGuideFontCatalog } from '@/hooks/useGuideFontLoader';
import {
  fetchGuideCategories,
  type GuideCategory,
} from '@/services/guideCategoryService';
import { createKemiGuide, updateKemiGuide } from '@/services/kemiPostService';
import { serializeGuideContent } from '@/utils/guideContentFormat';

export type GuideWriteDraft = {
  id: string;
  title: string;
  category: string;
  content: string;
  severity: GuideSeverity;
  fontId: string;
  fontSize: GuideFontSize;
};

type GuideWriteModalProps = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** 있으면 수정 모드 */
  editingGuide?: GuideWriteDraft | null;
};

function showGuideAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

export function GuideWriteModal({ visible, onClose, onSaved, editingGuide }: GuideWriteModalProps) {
  const isEditing = Boolean(editingGuide?.id);
  const editingIdRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [severity, setSeverity] = useState<GuideSeverity>('moderate');
  const [content, setContent] = useState('');
  const [fontId, setFontId] = useState(DEFAULT_GUIDE_FONT_ID);
  const [fontSize, setFontSize] = useState<GuideFontSize>(DEFAULT_GUIDE_FONT_SIZE);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const { fontFamily, loading: fontLoading } = useGuideFont(fontId);
  useGuideFontCatalog(visible);
  const [addCategoryVisible, setAddCategoryVisible] = useState(false);
  const [manageCategoryVisible, setManageCategoryVisible] = useState(false);

  const titleTypography = useMemo(
    () => buildGuideTextStyle(fontFamily, getGuideTitleFontSize(fontSize)),
    [fontFamily, fontSize],
  );

  const bodyTypography = useMemo(
    () => buildGuideTextStyle(fontFamily, fontSize),
    [fontFamily, fontSize],
  );

  const titleInputStyle = useMemo(
    () => [styles.titleInput, titleTypography],
    [titleTypography],
  );

  const bodyInputStyle = useMemo(
    () => [styles.bodyInput, bodyTypography],
    [bodyTypography],
  );

  const loadCategories = useCallback(async (preferredCategory?: string) => {
    setLoadingCategories(true);
    try {
      const results = await fetchGuideCategories();
      setCategories(results);
      setSelectedCategory((prev) => {
        const candidate = preferredCategory?.trim() || prev;
        if (candidate && results.some((item) => item.name === candidate)) return candidate;
        return results[0]?.name ?? '';
      });
    } catch (err) {
      showGuideAlert(
        '분류 불러오기 실패',
        err instanceof Error ? err.message : '다시 시도해 주세요.',
      );
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      editingIdRef.current = null;
      setSaveStatus('');
      return;
    }
    void loadCategories(editingGuide?.category);
  }, [visible, loadCategories, editingGuide?.category]);

  useEffect(() => {
    if (!visible) return;
    if (editingGuide?.id) {
      editingIdRef.current = editingGuide.id;
      setTitle(editingGuide.title);
      setSelectedCategory(editingGuide.category);
      setSeverity(editingGuide.severity);
      setContent(editingGuide.content);
      setFontId(editingGuide.fontId);
      setFontSize(editingGuide.fontSize);
      return;
    }
    editingIdRef.current = null;
    resetForm();
  }, [visible, editingGuide?.id]);

  const resetForm = () => {
    setTitle('');
    setSelectedCategory(categories[0]?.name ?? '');
    setSeverity('moderate');
    setContent('');
    setFontId(DEFAULT_GUIDE_FONT_ID);
    setFontSize(DEFAULT_GUIDE_FONT_SIZE);
  };

  const handleClose = () => {
    if (saving) return;
    if (!isEditing) resetForm();
    onClose();
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const category = selectedCategory.trim();
    const editId = editingIdRef.current ?? editingGuide?.id ?? null;

    if (!trimmedTitle || !trimmedContent) {
      showGuideAlert('입력 필요', '제목과 본문을 입력해 주세요.');
      return;
    }
    if (!category) {
      showGuideAlert('분류 필요', '분류를 선택하거나 분류를 추가해 주세요.');
      return;
    }

    setSaving(true);
    setSaveStatus(isEditing ? '수정 저장 중…' : '게시 중…');
    try {
      const serializedContent = serializeGuideContent(trimmedContent, { fontId, fontSize });
      if (editId) {
        await updateKemiGuide({
          id: editId,
          title: trimmedTitle,
          category,
          content: serializedContent,
          isPublished: true,
        });
        setSaveStatus('수정이 완료되었습니다.');
        showGuideAlert('저장 완료', '글이 수정되었습니다. 웹·앱에 동시 반영됩니다.');
        onSaved();
        onClose();
      } else {
        await createKemiGuide({
          title: trimmedTitle,
          category,
          content: serializedContent,
          isPublished: true,
        });
        resetForm();
        setSaveStatus('등록이 완료되었습니다.');
        showGuideAlert('저장 완료', '글이 등록되었습니다. 웹·앱에 동시 반영됩니다.');
        onSaved();
        onClose();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '다시 시도해 주세요.';
      setSaveStatus(message);
      showGuideAlert('저장 실패', message);
    } finally {
      setSaving(false);
    }
  };

  const handleCategoryCreated = (category: GuideCategory) => {
    setCategories((prev) => {
      if (prev.some((item) => item.name === category.name)) return prev;
      return [...prev, category].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    });
    setSelectedCategory(category.name);
  };

  const handleCategoryDeleted = (category: GuideCategory) => {
    setCategories((prev) => {
      const next = prev.filter((item) => item.id !== category.id);
      setSelectedCategory((current) => {
        if (current !== category.name) return current;
        return next[0]?.name ?? '';
      });
      return next;
    });
  };

  const handleFontChange = useCallback((nextFontId: string) => {
    setFontId(nextFontId);
  }, []);

  const handleFontSizeChange = useCallback((nextSize: GuideFontSize) => {
    setFontSize(nextSize);
  }, []);

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.screen}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <View style={styles.headerRow}>
              <Pressable onPress={handleClose} hitSlop={12} disabled={saving}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
              <Text style={styles.headerTitle}>{isEditing ? '수정하기' : '글쓰기'}</Text>
              <View style={styles.headerSpacer} />
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="always"
          >
            <Text style={styles.fieldLabel}>제목</Text>
            <TextInput
              key={`title-${fontId}-${fontSize}-${fontFamily ?? 'system'}`}
              style={titleInputStyle}
              value={title}
              onChangeText={setTitle}
              placeholder="글 제목을 입력하세요"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.fieldLabel}>응급 등급</Text>
            <View style={styles.sectionGap}>
              <SegmentControl
                options={GUIDE_SEVERITY_OPTIONS}
                value={severity}
                onChange={setSeverity}
              />
            </View>

            <View style={styles.categoryHeader}>
              <Text style={styles.fieldLabel}>분류</Text>
              <View style={styles.categoryActions}>
                <Pressable style={styles.manageButton} onPress={() => setManageCategoryVisible(true)}>
                  <Ionicons name="settings-outline" size={14} color="#475569" />
                  <Text style={styles.manageButtonText}>분류 관리</Text>
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => setAddCategoryVisible(true)}>
                  <Ionicons name="add" size={16} color="#dc2626" />
                  <Text style={styles.addButtonText}>분류 추가</Text>
                </Pressable>
              </View>
            </View>

            {loadingCategories ? (
              <View style={styles.loadingCategories}>
                <ActivityIndicator color="#0f172a" />
              </View>
            ) : (
              <View style={styles.categoryList}>
                {categories.map((category) => {
                  const selected = selectedCategory === category.name;
                  const iconName = resolveGuideIcon(category.icon);
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                      onPress={() => setSelectedCategory(category.name)}
                    >
                      <Ionicons
                        name={iconName}
                        size={16}
                        color={selected ? '#dc2626' : '#64748b'}
                      />
                      <Text
                        style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}
                      >
                        {category.name}
                      </Text>
                    </Pressable>
                  );
                })}
                {categories.length === 0 ? (
                  <Text style={styles.emptyCategoryText}>
                    분류가 없습니다. + 버튼으로 추가해 주세요.
                  </Text>
                ) : null}
              </View>
            )}

            <Text style={styles.fieldLabel}>본문</Text>
            <GuideTypographyToolbar
              active={visible}
              fontId={fontId}
              fontSize={fontSize}
              onChangeFontId={handleFontChange}
              onChangeFontSize={handleFontSizeChange}
            />

            <View style={styles.editorShell}>
              <TextInput
                key={`body-${fontId}-${fontSize}-${fontFamily ?? 'system'}`}
                style={bodyInputStyle}
                value={content}
                onChangeText={setContent}
                placeholder={
                  '응급 상황에서 알아두면 좋은 내용을 자유롭게 적어주세요.\n\n예시)\n가장 먼저 주변 안전을 확인하고 119에 신고합니다.\n환자의 의식과 호흡 상태를 살핀 뒤, 필요한 처치를 진행합니다.'
                }
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
                scrollEnabled
                editable={!fontLoading}
              />
              {fontLoading ? (
                <View style={styles.fontLoadingOverlay} pointerEvents="none">
                  <ActivityIndicator color="#0f172a" />
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            {saveStatus ? (
              <Text style={styles.saveStatusText} numberOfLines={3}>
                {saveStatus}
              </Text>
            ) : null}
            <Pressable
              style={[styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>{isEditing ? '수정 저장' : '게시하기'}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <GuideCategoryAddModal
        visible={addCategoryVisible}
        onClose={() => setAddCategoryVisible(false)}
        onCreated={handleCategoryCreated}
      />
      <GuideCategoryManageModal
        visible={manageCategoryVisible}
        categories={categories}
        onClose={() => setManageCategoryVisible(false)}
        onDeleted={handleCategoryDeleted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSpacer: {
    width: 24,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 28,
  },
  fieldLabel: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  sectionGap: {
    marginBottom: 16,
  },
  titleInput: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    includeFontPadding: false,
    fontWeight: '400',
  },
  categoryHeader: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  manageButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  loadingCategories: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 16,
  },
  categoryList: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryChipSelected: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  categoryChipText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#475569',
  },
  categoryChipTextSelected: {
    fontWeight: '700',
    color: '#dc2626',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#64748b',
  },
  editorShell: {
    position: 'relative',
    minHeight: 280,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bodyInput: {
    minHeight: 280,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlignVertical: 'top',
    includeFontPadding: false,
    fontWeight: '400',
  },
  fontLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,250,252,0.72)',
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  saveStatusText: {
    marginBottom: 10,
    fontSize: 12,
    lineHeight: 18,
    color: '#64748b',
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#dc2626',
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
