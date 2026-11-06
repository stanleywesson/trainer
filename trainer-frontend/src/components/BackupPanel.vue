<script setup lang="ts">
import { computed, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHistoryStore } from '@/stores/history'
import { BackupError, createBackup, lastBackupAt, markBackedUp, parseBackup, saveBackup, type BackupFile } from '@/utils/backup'

const STALE_AFTER_DAYS = 7

defineProps<{
    /** Fresh install: only offer to restore */
    restoreOnly?: boolean
}>()

const emit = defineEmits<{ restored: [] }>()

const history = useHistoryStore()
const calendar = useCalendarStore()

const lastBackup = ref(lastBackupAt())
const notice = ref<{ text: string, error?: boolean } | null>(null)
const fileInput = ref<HTMLInputElement>()
const preview = ref<{ backup: BackupFile, added: number, existing: number } | null>(null)
const replaceCalendar = ref(false)

const daysSinceBackup = computed(() => lastBackup.value === null
    ? null
    : Math.floor((Date.now() - new Date(lastBackup.value).getTime()) / 86_400_000))

const status = computed(() => {
    const days = daysSinceBackup.value
    if (days === null) return 'No backup yet'
    if (days <= 0) return 'Last backup: today'
    return days === 1 ? 'Last backup: yesterday' : `Last backup: ${days} days ago`
})

const overdue = computed(() => history.workouts.length > 0
    && (daysSinceBackup.value === null || daysSinceBackup.value >= STALE_AFTER_DAYS))

const calendarMode = computed(() => preview.value ? calendar.importMode(preview.value.backup.calendar) : 'none')

const calendarNote = computed(() => {
    switch (calendarMode.value) {
        case 'restore': return 'Your calendar will be restored from the backup.'
        case 'merge': return 'Any calendar days and ticks missing here will be added.'
        case 'different': return 'The backup has a different calendar from this one.'
        default: return ''
    }
})

const previewMessage = computed(() => {
    const p = preview.value
    if (!p) return ''
    const saved = new Date(p.backup.exportedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    const sessions = `${p.added} new session${p.added === 1 ? '' : 's'}, ${p.existing} already here`
    return `Saved ${saved}: ${sessions}. No sessions on this phone are deleted.`
})

async function backUp() {
    notice.value = null
    try {
        const result = await saveBackup(createBackup(history.workouts, calendar.state))
        if (result === 'cancelled') return
        markBackedUp()
        lastBackup.value = lastBackupAt()
        notice.value = { text: result === 'shared' ? 'Backup shared.' : 'Backup downloaded.' }
    } catch {
        notice.value = { text: "Couldn't create the backup. Please try again.", error: true }
    }
}

async function fileChosen(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    notice.value = null
    try {
        const backup = parseBackup(await file.text())
        const added = history.newSessions(backup.history).length
        replaceCalendar.value = false
        preview.value = { backup, added, existing: backup.history.length - added }
    } catch (e) {
        notice.value = { text: e instanceof BackupError ? e.message : "Couldn't read that file.", error: true }
    }
}

function restore() {
    const p = preview.value
    if (!p) return
    const replace = replaceCalendar.value
    preview.value = null
    try {
        history.importSessions(p.backup.history)
        calendar.importCalendar(p.backup.calendar, replace)
        if (lastBackup.value === null) {
            markBackedUp(p.backup.exportedAt)
            lastBackup.value = lastBackupAt()
        }
        notice.value = { text: `Restored ${p.added} session${p.added === 1 ? '' : 's'}.` }
        emit('restored')
    } catch {
        notice.value = { text: "Couldn't save the restored data. The phone's storage may be full.", error: true }
    }
}
</script>

<template>
    <div class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <div v-if="restoreOnly">
            <p class="text-white font-semibold">Already have a backup?</p>
            <p class="text-sm text-gray-400">Restore your history and calendar from a backup file.</p>
        </div>
        <p v-else :class="['text-sm font-semibold', overdue ? 'text-amber-400' : 'text-gray-400']">{{ status }}</p>

        <div class="flex gap-2">
            <button v-if="!restoreOnly" @click="backUp"
                class="flex-1 min-h-11 rounded-xl bg-indigo-600 text-white font-semibold active:scale-95 transition-transform">
                Back up
            </button>
            <button @click="fileInput?.click()"
                class="flex-1 min-h-11 rounded-xl border border-gray-600 text-gray-200 font-semibold active:scale-95 transition-transform">
                Restore
            </button>
        </div>
        <input ref="fileInput" type="file" accept=".json,.txt,application/json,text/plain" class="hidden"
            @change="fileChosen" />

        <p v-if="notice" :class="['text-sm', notice.error ? 'text-red-400' : 'text-emerald-400']">{{ notice.text }}</p>

        <ConfirmDialog v-if="preview" title="Restore this backup?" :message="previewMessage" confirm-label="Restore"
            @confirm="restore" @cancel="preview = null">
            <p v-if="calendarNote" class="text-sm text-gray-400">{{ calendarNote }}</p>
            <label v-if="calendarMode === 'different'" class="flex items-start gap-3 text-sm text-gray-200">
                <input v-model="replaceCalendar" type="checkbox" class="mt-0.5 size-5 shrink-0" />
                <span>Replace this calendar with the backup's. Otherwise this one is kept.</span>
            </label>
        </ConfirmDialog>
    </div>
</template>
