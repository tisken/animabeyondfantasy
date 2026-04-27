#!/usr/bin/env python3
import json, os, re, hashlib
PACKS_DIR = '/abftest/AnimaBeyondFoundry/src/packs'
DATA_DIR = '/docunima/output/items'
def mid(name, salt=''):
    h = hashlib.sha256(f'{salt}:{name}'.encode()).hexdigest()
    c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    r, n = '', int(h[:20], 16)
    while len(r) < 16: r += c[n % len(c)]; n //= len(c)
    return r
def sfn(n): return re.sub(r'\s+', '_', re.sub(r'[^\w\s-]', '', n).strip())[:60]
def mk(name, tp, system):
    _id = mid(name, tp)
    return {'folder':None,'name':name,'type':tp,'img':'icons/svg/item-bag.svg','system':system,'effects':[],'flags':{},
            '_stats':{'compendiumSource':None,'duplicateSource':None,'exportSource':None,'coreVersion':'14.359','systemId':'animabf','systemVersion':'2.3.0','createdTime':None,'modifiedTime':None,'lastModifiedBy':None},
            '_id':_id,'sort':0,'ownership':{'default':0},'_key':f'!items!{_id}'}
def wr(pack, items):
    d = os.path.join(PACKS_DIR, pack); os.makedirs(d, exist_ok=True)
    for i in items:
        with open(os.path.join(d, f"{i['type']}_{sfn(i['name'])}_{i['_id']}.json"), 'w', encoding='utf-8') as f: json.dump(i, f, ensure_ascii=False, indent=2)
    print(f'  {pack}: {len(items)}')
def gen_advantages():
    items = [mk(d['name'], 'advantage', {'category':{'value':str(d.get('extra','common')).lower() or 'common'},'cost':{'value':d.get('cost',1) if isinstance(d.get('cost',1),(int,float)) else 1},'description':{'value':str(d.get('effect','') or '')},'effectData':{'icon':'','disabled':True,'changes':[]}}) for d in json.load(open(f'{DATA_DIR}/advantages_excel.json')) if not d['name'].startswith('>') and not d['name'].startswith(' >')]
    wr('advantages', items)
def gen_disadvantages():
    items = [mk(d['name'], 'disadvantage', {'category':{'value':str(d.get('category','common')).lower()},'benefit':{'value':d.get('benefit',1) if isinstance(d.get('benefit',1),(int,float)) else 1},'description':{'value':str(d.get('effect','') or '')},'effectData':{'icon':'','disabled':True,'changes':[]}}) for d in json.load(open(f'{DATA_DIR}/disadvantages.json')) if not d['name'].startswith('>')]
    wr('disadvantages', items)
def gen_categories():
    items = []
    for d in json.load(open(f'{DATA_DIR}/categories_excel.json')):
        c = d.get('costs', {})
        items.append(mk(d['name'], 'category', {'categoryId':{'value':d['name'].lower().replace(' ','_')},'levels':{'value':1},'turnPerLevel':{'value':d.get('turnPerLevel',0) or 0},'lpPerLevel':{'value':d.get('lpPerLevel',0) or 0},'lifeMultiple':{'value':d.get('lifeMultiple',0) or 0},'mkPerLevel':{'value':d.get('mkPerLevel',0) or 0},'cvPerLevels':{'value':d.get('cvPerLevels',0) or 0},'limitCombat':{'value':d.get('limitCombat',0.6) or 0.6},'limitMagic':{'value':d.get('limitMagic',0.5) or 0.5},'limitPsychic':{'value':d.get('limitPsychic',0.5) or 0.5},'archetype1':{'value':d.get('archetype1','')},'archetype2':{'value':d.get('archetype2','')},'costs':{k:{'value':v or 0} for k,v in c.items()}}))
    wr('categories', items)
def gen_martial_arts():
    items = [mk(d['name'], 'martialArtData', {'grade':{'value':'base'},'complexity':{'value':1},'damageBase':{'value':d.get('Daño Base',0) or 0},'damageMax':{'value':d.get('Daño máximo',0) or 0},'damageType':{'value':'impact'},'bonusAttack':{'value':d.get('B. Ataque',0) or 0},'bonusBlock':{'value':d.get('Par',0) or 0},'bonusDodge':{'value':d.get('Esq',0) or 0},'bonusTurn':{'value':d.get('B. Turno',0) or 0},'bonusDamage':{'value':d.get('B. Daño',0) or 0},'bonusBreaking':{'value':d.get('B. Rotura',0) or 0},'bonusMasterAttack':{'value':d.get('B. Maestro: At',0) or 0},'bonusMasterDefense':{'value':d.get('B. Maestro Def',0) or 0},'bonusEndurance':{'value':d.get('B. Entereza',0) or 0},'critic':{'value':str(d.get('Crítico',''))},'special':{'value':str(d.get('Especial',''))},'requirements':{'value':str(d.get('Requisitos',''))},'martialKnowledge':{'value':d.get('CM (Total)',0) or 0},'penaltyHA':{'value':d.get('HA',0) or 0},'penaltyHE':{'value':d.get('HE',0) or 0},'penaltyHP':{'value':d.get('HP',0) or 0}}) for d in json.load(open(f'{DATA_DIR}/martial_arts_excel.json')) if not d['name'].startswith('>') and not d['name'].startswith(' >')]
    wr('martial_arts', items)
def gen_ki_skills():
    tree = json.load(open(f'{DATA_DIR}/ki_tree_excel.json')); manual = {m['name']:m for m in json.load(open(f'{DATA_DIR}/ki_skills.json'))}
    items = [mk(d['name'], 'kiSkillData', {'martialKnowledge':{'value':d.get('cm',0) or 0},'cost':{'value':manual.get(d['name'],{}).get('cost','')},'stat':{'value':manual.get(d['name'],{}).get('stat','')},'effect':{'value':manual.get(d['name'],{}).get('effect','')},'maintenance':{'value':0}}) for d in tree]
    wr('ki_skills', items)
def gen_metamagic():
    items = [mk(d['name'], 'metamagicData', {'grade':{'value':d.get('grade',1)},'branch':{'value':d.get('branch','')},'spheres':{'value':d.get('spheres',1)},'effect':{'value':d.get('effect','')}}) for d in json.load(open(f'{DATA_DIR}/metamagic.json'))]
    wr('metamagic', items)
def pw(p): return {'name':p.get('name',''),'difficulty':p.get('difficulty',0) or 0,'cost':p.get('cost',0) or 0,'attack':p.get('attack',0) or 0,'defense':p.get('defense',0) or 0,'action':p.get('action','active') or 'active','effect':p.get('effect','') or '','duration':p.get('duration','') or ''}
def gen_summons():
    items = []
    for d in json.load(open(f'{DATA_DIR}/great_beasts.json')):
        p = d.get('pact',{})
        items.append(mk(d['name'], 'summonData', {'summonType':{'value':'granBestia'},'tier':{'value':d.get('tier','minor')},'pact':{'description':{'value':p.get('description','') if isinstance(p,dict) else str(p)},'fulfilled':{'value':False}},'initialDifficulty':{'value':d.get('initialDifficulty',0) or 0},'initialCost':{'value':d.get('initialCost',0) or 0},'powers':[pw(x) for x in d.get('powers',[])]}))
    for d in json.load(open(f'{DATA_DIR}/arcana_complete.json')):
        inv = 'invertid' in d.get('name','').lower(); p = d.get('pact',{})
        items.append(mk(d['name'], 'summonData', {'summonType':{'value':'invertido' if inv else 'normal'},'tier':{'value':'arcana'},'pact':{'description':{'value':p.get('description','') if isinstance(p,dict) else ''},'fulfilled':{'value':False}},'initialDifficulty':{'value':d.get('difficulty',0) or 0},'initialCost':{'value':d.get('cost',0) or 0},'powers':[pw({'name':d.get('name',''),'difficulty':d.get('difficulty',0),'cost':d.get('cost',0),'effect':d.get('effect','')})]}))
    wr('summons', items)
if __name__ == '__main__':
    print('Generating...'); gen_advantages(); gen_disadvantages(); gen_categories(); gen_martial_arts(); gen_ki_skills(); gen_metamagic(); gen_summons(); print('Done!')

def gen_mental_patterns():
    items = []
    for d in json.load(open(f'{DATA_DIR}/mental_patterns_excel.json')):
        items.append(mk(d['name'], 'mentalPattern', {
            'bonus': {'value': d.get('Bonos', '')},
            'penalty': {'value': d.get('Penalizador', '')},
            'cost': {'value': d.get('Coste', 0) or 0},
            'cost2': {'value': d.get('Coste 2', 0) or 0},
            'opposite': {'value': d.get('Opuesto', '')},
            'description': {'value': d.get('Descripción', '')}
        }))
    wr('mental_patterns', items)

def gen_races():
    items = []
    for d in json.load(open(f'{DATA_DIR}/races_excel.json')):
        items.append(mk(d['name'], 'raceData', {
            'rf': {'value': d.get('RF', 0) or 0}, 're': {'value': d.get('RE', 0) or 0},
            'rv': {'value': d.get('RV', 0) or 0}, 'rm': {'value': d.get('RM', 0) or 0},
            'rp': {'value': d.get('RP', 0) or 0},
            'agi': {'value': d.get('AGI', 0) or 0}, 'con': {'value': d.get('CON', 0) or 0},
            'des': {'value': d.get('DES', 0) or 0}, 'fue': {'value': d.get('FUE', 0) or 0},
            'int': {'value': d.get('INT', 0) or 0}, 'per': {'value': d.get('PER', 0) or 0},
            'pod': {'value': d.get('POD', 0) or 0}, 'vol': {'value': d.get('VOL', 0) or 0},
            'size': {'value': d.get('Tamaño', 0) or 0},
            'regeneration': {'value': d.get('Regeneración', 0) or 0},
            'fatigue': {'value': d.get('Cansancio', 0) or 0},
            'description': {'value': d.get('Descripciones', '')}
        }))
    wr('races', items)

def gen_magic_items():
    items = []
    for d in json.load(open(f'{DATA_DIR}/magic_items.json')):
        fab = d.get('fabula', [0,0,0])
        if not isinstance(fab, list): fab = [0,0,0]
        while len(fab) < 3: fab.append(0)
        items.append(mk(d['name'], 'magicItemData', {
            'tier': {'value': d.get('tier', 'minor')},
            'powerLevel': {'value': d.get('powerLevel', 0) or 0},
            'fabula': {'grade1': fab[0] or 0, 'grade2': fab[1] or 0, 'grade3': fab[2] or 0},
            'itemType': {'value': d.get('type', '')},
            'effect': {'value': d.get('effect', '')},
            'source': {'value': d.get('source', '')}
        }))
    wr('magic_items', items)

if __name__ == '__main__':
    gen_mental_patterns(); gen_races(); gen_magic_items()
    print('Extra packs done!')
