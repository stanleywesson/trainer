<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { useCalendarStore } from '@/stores/calendar'
import { useHistoryStore } from '@/stores/history'
import { BackupError, createBackup, lastBackupAt, markBackedUp, parseBackup, saveBackup, type BackupFile } from '@/utils/backup'

const STALE_AFTER_DAYS = 7
const NOTICE_MS = 5000
const ERROR_NOTICE_MS = 10000

const props = defineProps<{
    /** Fresh install: a card that only offers to restore. Otherwise a compact icon with a menu. */
    restoreOnly?: boolean
}>()

const emit = defineEmits<{ restored: [] }>()

const history = useHistoryStore()
const calendar = useCalendarStore()

const menuOpen = ref(false)
const lastBackup = ref(lastBackupAt())
const notice = ref<{ text: string, error?: boolean } | null>(null)
const fileInput = ref<HTMLInputElement>()
const preview = ref<{ backup: BackupFile, added: number, existing: number } | null>(null)
const replaceCalendar = ref(false)

let noticeTimer: ReturnType<typeof setTimeout> | undefined

/** The card shows notices inline; the compact menu has no room, so they appear briefly as a toast */
function showNotice(text: string, error = false) {
    clearTimeout(noticeTimer)
    notice.value = { text, error }
    if (!props.restoreOnly) noticeTimer = setTimeout(() => { notice.value = null }, error ? ERROR_NOTICE_MS : NOTICE_MS)
}
onUnmounted(() => clearTimeout(noticeTimer))

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
    menuOpen.value = false
    notice.value = null
    try {
        const result = await saveBackup(createBackup(history.workouts, calendar.state))
        if (result === 'cancelled') return
        markBackedUp()
        lastBackup.value = lastBackupAt()
        showNotice(result === 'shared' ? 'Backup shared.' : 'Backup downloaded.')
    } catch {
        showNotice("Couldn't create the backup. Please try again.", true)
    }
}

function chooseFile() {
    menuOpen.value = false
    fileInput.value?.click()
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
        showNotice(e instanceof BackupError ? e.message : "Couldn't read that file.", true)
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
        showNotice(`Restored ${p.added} session${p.added === 1 ? '' : 's'}.`)
        emit('restored')
    } catch {
        showNotice("Couldn't save the restored data. The phone's storage may be full.", true)
    }
}
</script>

<template>
    <!-- First-run card -->
    <div v-if="restoreOnly" class="bg-gray-800 rounded-2xl p-4 flex flex-col gap-3">
        <div>
            <p class="text-white font-semibold">Already have a backup?</p>
            <p class="text-sm text-gray-400">Restore your history and calendar from a backup file.</p>
        </div>
        <button @click="chooseFile"
            class="min-h-11 rounded-xl border border-gray-600 text-gray-200 font-semibold active:scale-95 transition-transform">
            Restore
        </button>
        <p v-if="notice" :class="['text-sm', notice.error ? 'text-red-400' : 'text-emerald-400']">{{ notice.text }}</p>
    </div>

    <!-- Compact icon + menu -->
    <div v-else class="relative shrink-0">
        <button @click="menuOpen = !menuOpen" aria-label="Backup and restore" :aria-expanded="menuOpen"
            class="relative size-11 rounded-full bg-gray-800 text-gray-200 flex items-center justify-center active:scale-95 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75"
                stroke="currentColor" class="size-6" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
            </svg>
            <span v-if="overdue" data-testid="backup-overdue"
                class="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-amber-400 ring-2 ring-gray-800"></span>
        </button>

        <template v-if="menuOpen">
            <div class="fixed inset-0 z-30" @click="menuOpen = false"></div>
            <div class="absolute right-0 top-full mt-2 z-40 w-56 bg-gray-800 border border-gray-700 rounded-2xl p-2 shadow-xl flex flex-col">
                <p :class="['text-xs font-semibold px-3 py-2', overdue ? 'text-amber-400' : 'text-gray-400']">{{ status }}</p>
                <button @click="backUp"
                    class="min-h-11 px-3 rounded-xl text-left text-white font-semibold active:bg-gray-700">Back up</button>
                <button @click="chooseFile"
                    class="min-h-11 px-3 rounded-xl text-left text-white font-semibold active:bg-gray-700">Restore</button>
            </div>
        </template>

        <p v-if="notice" @click="notice = null" role="status" :class="['fixed inset-x-4 z-50 bottom-[calc(1rem+env(safe-area-inset-bottom))] rounded-xl px-4 py-3 text-sm font-semibold shadow-xl bg-gray-800 border',
            notice.error ? 'text-red-400 border-red-500/40' : 'text-emerald-400 border-emerald-500/40']">{{ notice.text }}</p>
    </div>

    <input ref="fileInput" type="file" accept=".json,.txt,application/json,text/plain" class="hidden"
        @change="fileChosen" />

    <ConfirmDialog v-if="preview" title="Restore this backup?" :message="previewMessage" confirm-label="Restore"
        @confirm="restore" @cancel="preview = null">
        <p v-if="calendarNote" class="text-sm text-gray-400">{{ calendarNote }}</p>
        <label v-if="calendarMode === 'different'" class="flex items-start gap-3 text-sm text-gray-200">
            <input v-model="replaceCalendar" type="checkbox" class="mt-0.5 size-5 shrink-0" />
            <span>Replace this calendar with the backup's. Otherwise this one is kept.</span>
        </label>
    </ConfirmDialog>
</template>
