const fs = require('fs'), vm = require('vm'), assert = require('assert');
let shown;
const values = {translationOriginalVolume: 5, translationVoiceVolume: 100};
const context = vm.createContext({
    configRead: key => values[key], t: value => value,
    showModal(header, content, id, update) { shown = {header, content, id, update}; },
    buttonItem(title, icon, commands) { return {title, icon, commands}; },
    overlayPanelItemListRenderer: (items, selectedIndex) => ({items, selectedIndex})
});
const source = fs.readFileSync(__dirname + '/../src/mods/ui/settings.js', 'utf8')
    .replace(/^import .*;\n/gm, '').replace('export const', 'const').replace('export default function', 'function').replace('export function', 'function');
vm.runInContext(source + '\nthis.options = translationOptions;', context);
context.optionShow({options: context.options, selectedIndex: 0, menuId: 'lsptube-translation-settings'}, false);
const parent = shown;
for (const [index, key, id] of [[0, 'translationOriginalVolume', 'lsptube-original-volume'], [1, 'translationVoiceVolume', 'lsptube-voice-volume']]) {
    const command = parent.content.items[index].commands[0].customAction;
    context.optionShow(command.parameters, command.parameters.update);
    assert.equal(shown.id, id); assert.notEqual(shown.id, parent.id, 'nested popup needs its own identity');
    assert.equal(shown.content.selectedIndex, 0);
    for (const choice of shown.content.items) {
        const setting = choice.commands[0].setClientSettingEndpoint.settingDatas[0];
        assert.equal(setting.clientSettingEnum.item, key);
        assert(Number.isInteger(setting.intValue), 'volume uses the integer setting field');
        values[key] = setting.intValue;
        const refresh = choice.commands[1].customAction;
        context.optionShow(refresh.parameters, refresh.parameters.update);
        assert.equal(shown.id, id); assert.equal(shown.update, true);
        assert(shown.content.items.some(item => item.icon.secondaryIcon === 'RADIO_BUTTON_CHECKED'));
    }
}
console.log('PASS: actual translation menus open distinct volume popups and retain selection');
