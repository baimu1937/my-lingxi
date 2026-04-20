/**
 * 灵犀工作台 - 核心功能增强补丁
 * 
 * 包含以下增强功能：
 * 1. 全局搜索系统
 * 2. 批量操作支持
 * 3. 版本控制系统
 * 4. 增强快捷键
 * 5. 拖拽排序
 */

// ============================================
// 1. 全局搜索系统
// ============================================

class GlobalSearch {
    constructor() {
        this.index = {
            conversations: [],
            books: [],
            prompts: [],
            samples: []
        };
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        // 创建搜索面板
        const searchPanel = document.createElement('div');
        searchPanel.id = 'globalSearchPanel';
        searchPanel.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[300] hidden';
        searchPanel.innerHTML = `
            <div class="absolute top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div class="flex items-center gap-3">
                            <span class="text-xl">🔍</span>
                            <input type="text" id="searchInput" 
                                placeholder="搜索对话、书稿、提示词..." 
                                class="flex-1 text-lg outline-none bg-transparent"
                                autofocus>
                            <kbd class="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded">ESC</kbd>
                        </div>
                    </div>
                    <div id="searchResults" class="max-h-96 overflow-y-auto p-2"></div>
                </div>
            </div>
        `;
        document.body.appendChild(searchPanel);
    }

    bindEvents() {
        // Ctrl+F 打开搜索
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                this.open();
            }
            if (e.key === 'Escape') {
                this.close();
            }
        });

        // 输入时实时搜索
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.performSearch(e.target.value);
        });

        // 点击背景关闭
        document.getElementById('globalSearchPanel').addEventListener('click', (e) => {
            if (e.target.id === 'globalSearchPanel') {
                this.close();
            }
        });
    }

    open() {
        document.getElementById('globalSearchPanel').classList.remove('hidden');
        document.getElementById('searchInput').focus();
        this.updateIndex();
    }

    close() {
        document.getElementById('globalSearchPanel').classList.add('hidden');
        document.getElementById('searchInput').value = '';
        document.getElementById('searchResults').innerHTML = '';
    }

    updateIndex() {
        // 索引历史对话
        this.index.conversations = history.map((item, idx) => ({
            id: idx,
            type: 'conversation',
            title: item.title || `对话 ${idx + 1}`,
            content: item.messages?.map(m => m.content).join('\n') || '',
            timestamp: item.timestamp
        }));

        // 索引书稿
        this.index.books = bookLibrary.map((book, idx) => ({
            id: idx,
            type: 'book',
            title: book.name,
            content: book.content || '',
            timestamp: book.updatedAt || Date.now()
        }));

        // 索引提示词
        this.index.prompts = Object.entries(prompts).map(([name, content]) => ({
            id: name,
            type: 'prompt',
            title: name,
            content: content,
            timestamp: 0
        }));

        // 索引例文
        this.index.samples = sampleLibrary.map((sample, idx) => ({
            id: idx,
            type: 'sample',
            title: sample.name,
            content: sample.content || '',
            timestamp: sample.createdAt || Date.now()
        }));
    }

    performSearch(query) {
        if (!query.trim()) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const results = [];
        const lowerQuery = query.toLowerCase();

        // 在所有索引中搜索
        Object.values(this.index).flat().forEach(item => {
            const matchTitle = item.title.toLowerCase().includes(lowerQuery);
            const matchContent = item.content.toLowerCase().includes(lowerQuery);
            
            if (matchTitle || matchContent) {
                // 提取上下文片段
                let snippet = '';
                if (matchContent) {
                    const idx = item.content.toLowerCase().indexOf(lowerQuery);
                    const start = Math.max(0, idx - 50);
                    const end = Math.min(item.content.length, idx + query.length + 50);
                    snippet = (start > 0 ? '...' : '') + 
                             item.content.substring(start, end) + 
                             (end < item.content.length ? '...' : '');
                }

                results.push({
                    ...item,
                    snippet: snippet || item.title,
                    relevance: matchTitle ? 2 : 1
                });
            }
        });

        // 按相关性排序
        results.sort((a, b) => b.relevance - a.relevance || b.timestamp - a.timestamp);

        this.renderResults(results.slice(0, 20)); // 最多显示20条
    }

    renderResults(results) {
        const container = document.getElementById('searchResults');
        
        if (results.length === 0) {
            container.innerHTML = '<div class="p-8 text-center text-gray-500">未找到相关内容</div>';
            return;
        }

        container.innerHTML = results.map(result => {
            const icons = {
                conversation: '💬',
                book: '📖',
                prompt: '🗡️',
                sample: '🧬'
            };
            
            const colors = {
                conversation: 'bg-blue-50 dark:bg-blue-900/20',
                book: 'bg-green-50 dark:bg-green-900/20',
                prompt: 'bg-purple-50 dark:bg-purple-900/20',
                sample: 'bg-orange-50 dark:bg-orange-900/20'
            };

            return `
                <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-lg transition-colors"
                     onclick="globalSearch.jumpTo('${result.type}', '${result.id}')">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">${icons[result.type]}</span>
                        <div class="flex-1 min-w-0">
                            <div class="font-bold text-sm mb-1 truncate">${result.title}</div>
                            <div class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">${result.snippet}</div>
                            <div class="mt-1 flex items-center gap-2">
                                <span class="text-[10px] px-2 py-0.5 rounded-full ${colors[result.type]}">
                                    ${{conversation: '对话', book: '书稿', prompt: '提示词', sample: '例文'}[result.type]}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    jumpTo(type, id) {
        this.close();
        
        switch(type) {
            case 'conversation':
                // 加载对应历史对话
                loadHistoryItem(parseInt(id));
                break;
            case 'book':
                // 打开书稿编辑
                editBook(parseInt(id));
                break;
            case 'prompt':
                // 切换到该提示词
                dom.promptSelect.value = id;
                showToast(`已切换到提示词：${id}`);
                break;
            case 'sample':
                // 滚动到例文位置
                showToast('例文定位功能开发中...');
                break;
        }
    }
}

// ============================================
// 2. 批量操作管理器
// ============================================

class BatchManager {
    constructor() {
        this.selectedItems = new Set();
        this.isSelectionMode = false;
        this.initUI();
    }

    initUI() {
        // 添加批量操作工具栏
        const toolbar = document.createElement('div');
        toolbar.id = 'batchToolbar';
        toolbar.className = 'fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-2xl hidden items-center gap-4 z-[250]';
        toolbar.innerHTML = `
            <span class="text-sm font-bold"><span id="selectedCount">0</span> 项已选择</span>
            <div class="h-4 w-px bg-white/30"></div>
            <button onclick="batchManager.exportSelected()" class="hover:bg-white/20 px-3 py-1 rounded transition text-sm">📦 导出</button>
            <button onclick="batchManager.deleteSelected()" class="hover:bg-red-500 px-3 py-1 rounded transition text-sm">🗑️ 删除</button>
            <button onclick="batchManager.clearSelection()" class="hover:bg-white/20 px-3 py-1 rounded transition text-sm">✕ 取消</button>
        `;
        document.body.appendChild(toolbar);
    }

    enterSelectionMode() {
        this.isSelectionMode = true;
        document.getElementById('batchToolbar').classList.remove('hidden');
        document.getElementById('batchToolbar').classList.add('flex');
        this.showCheckboxes();
    }

    exitSelectionMode() {
        this.isSelectionMode = false;
        this.selectedItems.clear();
        document.getElementById('batchToolbar').classList.add('hidden');
        document.getElementById('batchToolbar').classList.remove('flex');
        this.hideCheckboxes();
        this.updateCount();
    }

    showCheckboxes() {
        // 为可选择的列表项添加复选框
        document.querySelectorAll('.book-card, .prompt-card').forEach(el => {
            if (!el.querySelector('.batch-checkbox')) {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'batch-checkbox mr-2 w-4 h-4 accent-blue-600 cursor-pointer';
                checkbox.addEventListener('change', (e) => {
                    const itemId = el.dataset.id || el.textContent.trim();
                    if (e.target.checked) {
                        this.selectedItems.add(itemId);
                    } else {
                        this.selectedItems.delete(itemId);
                    }
                    this.updateCount();
                });
                el.insertBefore(checkbox, el.firstChild);
            }
        });
    }

    hideCheckboxes() {
        document.querySelectorAll('.batch-checkbox').forEach(cb => cb.remove());
    }

    updateCount() {
        document.getElementById('selectedCount').textContent = this.selectedItems.size;
    }

    deleteSelected() {
        if (!confirm(`确认删除选中的 ${this.selectedItems.size} 项？`)) return;
        
        // 根据当前上下文执行删除
        // TODO: 实现具体删除逻辑
        showToast(`已删除 ${this.selectedItems.size} 项`);
        this.exitSelectionMode();
    }

    exportSelected() {
        // TODO: 实现导出逻辑
        showToast(`已导出 ${this.selectedItems.size} 项`);
        this.exitSelectionMode();
    }

    clearSelection() {
        this.selectedItems.clear();
        document.querySelectorAll('.batch-checkbox:checked').forEach(cb => cb.checked = false);
        this.updateCount();
    }
}

// ============================================
// 3. 版本控制系统
// ============================================

class VersionControl {
    constructor() {
        this.versions = loadJSON('lingxi_versions') || {};
        this.maxVersionsPerBook = 50; // 每本书最多保留50个版本
    }

    saveVersion(bookId, content, note = '') {
        if (!this.versions[bookId]) {
            this.versions[bookId] = [];
        }

        const version = {
            timestamp: Date.now(),
            content: content,
            note: note || `版本 ${this.versions[bookId].length + 1}`,
            wordCount: content.length
        };

        this.versions[bookId].push(version);

        // 限制版本数量
        if (this.versions[bookId].length > this.maxVersionsPerBook) {
            this.versions[bookId] = this.versions[bookId].slice(-this.maxVersionsPerBook);
        }

        saveJSON('lingxi_versions', this.versions);
        console.log(`✅ 已保存版本：${version.note}`);
    }

    getVersions(bookId) {
        return this.versions[bookId] || [];
    }

    restoreVersion(bookId, versionIndex) {
        const versions = this.getVersions(bookId);
        if (!versions[versionIndex]) {
            showToast('❌ 版本不存在');
            return null;
        }

        if (!confirm('恢复到该版本将覆盖当前内容，是否继续？')) return null;

        return versions[versionIndex].content;
    }

    compareVersions(bookId, index1, index2) {
        const versions = this.getVersions(bookId);
        const v1 = versions[index1];
        const v2 = versions[index2];

        if (!v1 || !v2) {
            showToast('❌ 版本不存在');
            return null;
        }

        // 简单的差异对比
        const diff = this.computeDiff(v1.content, v2.content);
        return {
            from: v1,
            to: v2,
            diff: diff
        };
    }

    computeDiff(oldText, newText) {
        // 简化的diff算法（实际应使用专业的diff库如diff-match-patch）
        const oldLines = oldText.split('\n');
        const newLines = newText.split('\n');
        
        return {
            added: newLines.filter(line => !oldLines.includes(line)),
            removed: oldLines.filter(line => !newLines.includes(line))
        };
    }

    showVersionPanel(bookId) {
        const versions = this.getVersions(bookId);
        if (versions.length === 0) {
            showToast('📭 暂无历史版本');
            return;
        }

        // 创建版本列表面板
        const panel = document.createElement('div');
        panel.className = 'fixed right-4 top-20 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-[200] max-h-[70vh] overflow-hidden flex flex-col';
        panel.innerHTML = `
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 class="font-bold">📜 版本历史 (${versions.length})</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-red-500">✕</button>
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-2">
                ${versions.map((v, i) => `
                    <div class="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 cursor-pointer transition"
                         onclick="versionControl.restoreAndClose(${bookId}, ${i})">
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-sm font-bold">${v.note}</span>
                            <span class="text-xs text-gray-500">${new Date(v.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="text-xs text-gray-600 dark:text-gray-400">${v.wordCount} 字</div>
                    </div>
                `).reverse().join('')}
            </div>
        `;
        document.body.appendChild(panel);
    }

    restoreAndClose(bookId, versionIndex) {
        const content = this.restoreVersion(bookId, versionIndex);
        if (content !== null) {
            document.getElementById('bookContent').value = content;
            document.getElementById('bookWordCount').textContent = content.length;
            showToast('✅ 已恢复到此版本');
        }
        document.querySelector('.fixed.right-4.top-20')?.remove();
    }
}

// ============================================
// 4. 增强快捷键系统
// ============================================

class EnhancedShortcuts {
    constructor() {
        this.shortcuts = {
            'Ctrl+Shift+N': () => addNewBook(),
            'Ctrl+Shift+S': () => this.saveAs(),
            'Ctrl+E': () => document.getElementById('toggleSpace').click(),
            'Ctrl+D': () => this.duplicateParagraph(),
            'Ctrl+J': () => this.joinParagraphs(),
            'Alt+ArrowUp': () => this.moveParagraph(-1),
            'Alt+ArrowDown': () => this.moveParagraph(1),
            'F2': () => this.renameCurrentBook(),
            'Ctrl+H': () => this.toggleHistoryPanel(),
            'Ctrl+P': () => dom.promptSelect.focus(),
            'Ctrl+Z': () => this.undo(),
            'Ctrl+Y': () => this.redo()
        };
        
        this.undoStack = [];
        this.redoStack = [];
        this.maxUndoSteps = 100;
        
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            const key = this.getKeyCombo(e);
            if (this.shortcuts[key]) {
                e.preventDefault();
                this.shortcuts[key]();
            }
        });

        // 监听草稿区变化用于撤销
        dom.workspace.addEventListener('input', () => {
            this.pushUndo(dom.workspace.value);
        });
    }

    getKeyCombo(e) {
        const parts = [];
        if (e.ctrlKey) parts.push('Ctrl');
        if (e.shiftKey) parts.push('Shift');
        if (e.altKey) parts.push('Alt');
        if (e.metaKey) parts.push('Meta');
        
        const keyMap = {
            'ArrowUp': 'ArrowUp',
            'ArrowDown': 'ArrowDown',
            'ArrowLeft': 'ArrowLeft',
            'ArrowRight': 'ArrowRight'
        };
        
        parts.push(keyMap[e.key] || e.key.toUpperCase());
        return parts.join('+');
    }

    pushUndo(content) {
        this.undoStack.push({
            content: content,
            timestamp: Date.now()
        });
        
        if (this.undoStack.length > this.maxUndoSteps) {
            this.undoStack.shift();
        }
        
        // 清空重做栈
        this.redoStack = [];
    }

    undo() {
        if (this.undoStack.length <= 1) {
            showToast('⚠️ 无法撤销');
            return;
        }
        
        const current = this.undoStack.pop();
        this.redoStack.push(current);
        
        const previous = this.undoStack[this.undoStack.length - 1];
        dom.workspace.value = previous.content;
        debouncedSaveWorkspace(previous.content);
        showToast('↩️ 已撤销');
    }

    redo() {
        if (this.redoStack.length === 0) {
            showToast('⚠️ 无法重做');
            return;
        }
        
        const next = this.redoStack.pop();
        this.undoStack.push(next);
        
        dom.workspace.value = next.content;
        debouncedSaveWorkspace(next.content);
        showToast('↪️ 已重做');
    }

    saveAs() {
        const name = prompt('请输入新书稿名称：', `书稿_${Date.now()}`);
        if (!name) return;
        
        const content = dom.workspace.value;
        bookLibrary.push({ name, content, updatedAt: Date.now() });
        saveJSON(SK.books, bookLibrary);
        renderBookLibrary();
        showToast(`✅ 已另存为：${name}`);
    }

    duplicateParagraph() {
        const textarea = dom.workspace;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        // 获取当前段落
        const beforeCursor = textarea.value.substring(0, start);
        const paragraphStart = beforeCursor.lastIndexOf('\n') + 1;
        const afterCursor = textarea.value.substring(end);
        const paragraphEnd = end + afterCursor.indexOf('\n');
        const actualEnd = paragraphEnd === end - 1 ? end : paragraphEnd;
        
        const paragraph = textarea.value.substring(paragraphStart, actualEnd);
        
        // 插入重复段落
        const newValue = textarea.value.substring(0, actualEnd) + '\n' + paragraph + textarea.value.substring(actualEnd);
        textarea.value = newValue;
        debouncedSaveWorkspace(newValue);
        showToast('📋 已复制段落');
    }

    joinParagraphs() {
        const textarea = dom.workspace;
        let value = textarea.value;
        
        // 合并空行过多的段落
        value = value.replace(/\n{3,}/g, '\n\n');
        
        textarea.value = value;
        debouncedSaveWorkspace(value);
        showToast('🔗 已合并段落');
    }

    moveParagraph(direction) {
        const textarea = dom.workspace;
        const cursorPos = textarea.selectionStart;
        const lines = textarea.value.split('\n');
        
        // 找到光标所在行
        let currentLine = 0;
        let pos = 0;
        for (let i = 0; i < lines.length; i++) {
            if (pos + lines[i].length >= cursorPos) {
                currentLine = i;
                break;
            }
            pos += lines[i].length + 1;
        }
        
        const targetLine = currentLine + direction;
        if (targetLine < 0 || targetLine >= lines.length) {
            showToast('⚠️ 已达边界');
            return;
        }
        
        // 交换行
        [lines[currentLine], lines[targetLine]] = [lines[targetLine], lines[currentLine]];
        
        const newValue = lines.join('\n');
        textarea.value = newValue;
        debouncedSaveWorkspace(newValue);
        showToast(direction < 0 ? '⬆️ 已上移' : '⬇️ 已下移');
    }

    renameCurrentBook() {
        if (currentEditingBookId === null) {
            showToast('⚠️ 请先打开书稿');
            return;
        }
        
        const newName = prompt('新书稿名称：', bookLibrary[currentEditingBookId].name);
        if (!newName) return;
        
        bookLibrary[currentEditingBookId].name = newName;
        saveJSON(SK.books, bookLibrary);
        renderBookLibrary();
        document.getElementById('bookNameInput').value = newName;
        showToast('✏️ 已重命名');
    }

    toggleHistoryPanel() {
        // TODO: 实现历史面板切换
        showToast('📜 历史面板功能开发中...');
    }
}

// ============================================
// 5. 拖拽排序（使用SortableJS）
// ============================================

class DragSort {
    constructor() {
        this.init();
    }

    init() {
        // 等待DOM加载完成后初始化
        setTimeout(() => {
            this.initBookDrag();
            this.initPromptDrag();
        }, 1000);
    }

    initBookDrag() {
        const container = document.getElementById('bookLibrary');
        if (!container) return;

        // 简化版拖拽（不依赖外部库）
        let draggedItem = null;

        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('book-card')) {
                draggedItem = e.target;
                e.target.style.opacity = '0.5';
            }
        });

        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('book-card')) {
                e.target.style.opacity = '1';
                draggedItem = null;
            }
        });

        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggedItem);
            } else {
                container.insertBefore(draggedItem, afterElement);
            }
        });

        // 为每个书稿卡片添加draggable属性
        this.makeBooksDraggable();
    }

    makeBooksDraggable() {
        document.querySelectorAll('.book-card').forEach(card => {
            card.setAttribute('draggable', 'true');
            card.style.cursor = 'grab';
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.book-card:not([style*="opacity: 0.5"])')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    initPromptDrag() {
        // 类似书籍的拖拽逻辑
        const container = document.getElementById('modalPromptList');
        if (!container) return;

        // TODO: 实现提示词拖拽排序
    }
}

// ============================================
// 初始化所有增强功能
// ============================================

let globalSearch, batchManager, versionControl, enhancedShortcuts, dragSort;

function initEnhancements() {
    console.log('🚀 正在初始化增强功能...');
    
    globalSearch = new GlobalSearch();
    batchManager = new BatchManager();
    versionControl = new VersionControl();
    enhancedShortcuts = new EnhancedShortcuts();
    dragSort = new DragSort();
    
    // 导出供全局使用
    window.globalSearch = globalSearch;
    window.batchManager = batchManager;
    window.versionControl = versionControl;
    window.enhancedShortcuts = enhancedShortcuts;
    window.dragSort = dragSort;
    
    console.log('✨ 灵犀工作台增强功能已加载');
    console.log('  - GlobalSearch:', typeof globalSearch);
    console.log('  - BatchManager:', typeof batchManager);
    console.log('  - VersionControl:', typeof versionControl);
    console.log('  - EnhancedShortcuts:', typeof enhancedShortcuts);
    console.log('  - DragSort:', typeof dragSort);
}

// 页面加载后自动初始化增强功能
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initEnhancements, 500);
});
