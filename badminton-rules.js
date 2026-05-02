/**
 * 羽毛球规则引擎 - BWF 国际羽联规则实现
 * Badminton Rules Engine - BWF Official Rules Implementation
 *
 * 支持规则:
 * 1. 单打规则
 * 2. 双打规则
 * 3. 双打发球轮换
 * 4. 奇偶区发球
 * 5. 30分封顶规则
 * 6. Deuce规则 (领先2分获胜)
 * 7. 第三局11分换边
 * 8. 局间换边
 * 9. 发球方提示
 * 10. 发球区域提示
 * 11. 当前站位提示
 * 12. 犯规判定
 * 13. 裁判模式
 */

class BadmintonRules {
    constructor() {
        // 场地位置枚举
        this.CourtSide = {
            LEFT: 'left',      // 左侧
            RIGHT: 'right'     // 右侧
        };

        this.CourtArea = {
            // 发球区域 (双打)
            RIGHT_SERVICE_AREA: 'right_service',   // 右发球区
            LEFT_SERVICE_AREA: 'left_service',     // 左发球区
            // 单打场地
            LEFT_SINGLES_AREA: 'left_singles',
            RIGHT_SINGLES_AREA: 'right_singles'
        };

        this.PlayerPosition = {
            // 双打站位
            LEFT_SERVER: 'left_server',           // 左发球员
            RIGHT_SERVER: 'right_server',         // 右发球员
            LEFT_RECEIVER: 'left_receiver',      // 左接球员
            RIGHT_RECEIVER: 'right_receiver',     // 右接球员
            // 单打站位
            LEFT_COURT: 'left_court',
            RIGHT_COURT: 'right_court'
        };

        // 初始化状态
        this.reset();
    }

    /**
     * 重置规则引擎状态
     */
    reset() {
        this.state = {
            // 当前比赛模式: 'single' 单打, 'double' 双打
            mode: 'single',

            // 比分制度: 11, 15, 21
            scoringSystem: 21,

            // 是否为第三局
            isThirdGame: false,

            // 发球轮换相关 (双打)
            servingPair: 'A',           // 当前发球方: 'A' 或 'B'
            receivingPair: 'B',         // 当前接发球方
            lastPointWinner: null,      // 上一分获胜方
            servingRotationIndex: 0,    // 发球轮换索引

            // 场地位置
            playerACourtSide: this.CourtSide.LEFT,  // A方当前场地侧
            playerBCourtSide: this.CourtSide.RIGHT, // B方当前场地侧

            // 发球位置 (基于奇偶比分)
            serviceCourt: this.CourtArea.RIGHT_SERVICE_AREA,

            // 当前发球方
            currentServer: 'A',

            // 当前接发球方
            currentReceiver: 'B',

            // 是否在发球方
            isServing: true,

            // Deuce 状态
            isDeuce: false,
            deuceStarted: false,

            // 30分封顶 (当比分达到29:29时)
            isAtCap: false,       // 是否到达30分封顶
            capReached: false,    // 是否已经触发30分封顶规则

            // 换边相关
            needSideChange: false,         // 需要换边
            sideChangeAt: null,            // 需要换边的比分 (如第三局11分)
            lastSideChangeAt: {            // 上次换边时的比分
                playerA: 0,
                playerB: 0
            },

            // 犯规提示
            fault: null,
            faultReason: null,

            // 比赛结束
            isMatchComplete: false,
            winner: null,

            // 裁判模式
            umpireMode: false,
            challengeAvailable: 3  // 挑战次数 (可选)
        };

        return this.state;
    }

    /**
     * 初始化比赛
     * @param {Object} config - 比赛配置
     * @param {string} config.mode - 'single' 或 'double'
     * @param {number} config.scoringSystem - 11, 15, 或 21
     * @param {number} config.gamesToWin - 需获胜局数
     * @param {string} config.firstServer - 首发球方 'A' 或 'B'
     */
    initializeMatch(config) {
        this.reset();

        this.state.mode = config.mode || 'single';
        this.state.scoringSystem = config.scoringSystem || 21;
        this.state.currentServer = config.firstServer || 'A';
        this.state.servingPair = config.firstServer || 'A';
        this.state.receivingPair = config.firstServer === 'A' ? 'B' : 'A';
        this.state.currentReceiver = config.firstServer === 'A' ? 'B' : 'A';

        // 初始化发球位置
        this.updateServiceCourt(0, 0);

        // 设置第三局换边点 (11分)
        if (config.gamesToWin === 3) {
            this.state.sideChangeAt = 11;
        }

        return this.getState();
    }

    /**
     * 获取完整状态
     */
    getState() {
        return { ...this.state };
    }

    /**
     * 获取当前可读状态摘要
     */
    getStatusSummary() {
        const s = this.state;
        return {
            mode: s.mode === 'single' ? '单打' : '双打',
            scoringSystem: s.scoringSystem + '分制',
            currentServer: s.currentServer,
            currentReceiver: s.currentReceiver,
            serviceCourt: this.getServiceCourtName(),
            serverPosition: this.getServerPositionName(),
            receiverPosition: this.getReceiverPositionName(),
            playerACourtSide: s.playerACourtSide === this.CourtSide.LEFT ? '左侧' : '右侧',
            playerBCourtSide: s.playerBCourtSide === this.CourtSide.LEFT ? '左侧' : '右侧',
            isDeuce: s.isDeuce,
            isAtCap: s.isAtCap,
            needSideChange: s.needSideChange,
            fault: s.fault,
            faultReason: s.faultReason
        };
    }

    /**
     * 更新发球区域 (基于发球方分数的奇偶)
     * BWF规则:
     * - 偶数分在右发球区
     * - 奇数分在左发球区
     * - 接发球方必须站在对角对应区
     *
     * @param {number} scoreA - A方得分
     * @param {number} scoreB - B方得分
     */
    updateServiceCourt(scoreA, scoreB) {
        // 获取发球方的分数
        const serverScore = this.state.currentServer === 'A' ? scoreA : scoreB;
        const serverParity = serverScore % 2; // 0 = 偶数, 1 = 奇数

        // BWF规则: 偶数分在右发球区, 奇数分在左发球区
        if (serverParity === 0) {
            // 偶得分 - 右区发球
            this.state.serviceCourt = this.state.mode === 'single'
                ? this.CourtArea.RIGHT_SINGLES_AREA
                : this.CourtArea.RIGHT_SERVICE_AREA;
        } else {
            // 奇得分 - 左区发球
            this.state.serviceCourt = this.state.mode === 'single'
                ? this.CourtArea.LEFT_SINGLES_AREA
                : this.CourtArea.LEFT_SERVICE_AREA;
        }

        // 单打: 发球方站在对应侧, 接发球方站在对角
        // 双打: 同上, 但保持各自的站位
        if (this.state.currentServer === 'A') {
            // A方发球
            this.state.playerACourtSide = serverParity === 0
                ? this.CourtSide.RIGHT
                : this.CourtSide.LEFT;
            // B方(A的接发球方)必须站在对角
            this.state.playerBCourtSide = serverParity === 0
                ? this.CourtSide.LEFT
                : this.CourtSide.RIGHT;
        } else {
            // B方发球
            this.state.playerBCourtSide = serverParity === 0
                ? this.CourtSide.RIGHT
                : this.CourtSide.LEFT;
            // A方(B的接发球方)必须站在对角
            this.state.playerACourtSide = serverParity === 0
                ? this.CourtSide.LEFT
                : this.CourtSide.RIGHT;
        }

        return this.state.serviceCourt;
    }

    /**
     * 计算得分后的是否需要换边
     * @param {number} scoreA - A方得分
     * @param {number} scoreB - B方得分
     * @param {number} currentGame - 当前局数
     */
    checkSideChangeNeeded(scoreA, scoreB, currentGame) {
        this.state.needSideChange = false;

        // 局间换边: 每局结束后换边
        // 第三局在11分时换边

        if (this.state.sideChangeAt && currentGame === 3) {
            // 第三局11分换边
            const previousTotal = this.state.lastSideChangeAt.playerA + this.state.lastSideChangeAt.playerB;

            if (previousTotal < 11 && (scoreA + scoreB) >= 11) {
                this.state.needSideChange = true;
                return true;
            }
        }

        return false;
    }

    /**
     * 执行换边
     */
    performSideChange() {
        // 交换场地侧
        const tempSide = this.state.playerACourtSide;
        this.state.playerACourtSide = this.state.playerBCourtSide;
        this.state.playerBCourtSide = tempSide;

        // 记录换边时的比分
        this.state.lastSideChangeAt = {
            playerA: this.getScore('A'),
            playerB: this.getScore('B')
        };

        this.state.needSideChange = false;

        return true;
    }

    /**
     * 处理得分并更新规则状态
     * @param {string} winner - 获胜方 'A' 或 'B'
     * @param {number} currentScoreA - A方当前得分
     * @param {number} currentScoreB - B方当前得分
     * @param {number} gamesWonA - A方已获胜局数
     * @param {number} gamesWonB - B方已获胜局数
     * @param {number} currentGame - 当前局数 (1, 2, 或 3)
     */
    handlePoint(winner, currentScoreA, currentScoreB, gamesWonA, gamesWonB, currentGame) {
        const result = {
            action: 'point',
            winner: winner,
            newScoreA: currentScoreA,
            newScoreB: currentScoreB,
            serverChanged: false,
            sideChanged: false,
            gameEnded: false,
            matchEnded: false,
            winner: null,
            isDeuce: false,
            isAtCap: false,
            nextServer: this.state.currentServer,
            nextReceiver: this.state.currentReceiver,
            serviceCourt: this.state.serviceCourt,
            needSideChange: false,
            fault: null,
            faultReason: null
        };

        // 检查30分封顶
        this.checkCapRule(currentScoreA, currentScoreB);

        // 检查 Deuce
        this.checkDeuce(currentScoreA, currentScoreB);

        // 处理双打发球轮换
        if (this.state.mode === 'double') {
            this.handleDoubleServingRotation(winner, currentScoreA, currentScoreB);
        } else {
            // 单打: 得分方获得发球权
            if (winner === 'A') {
                this.state.currentServer = 'A';
                this.state.currentReceiver = 'B';
            } else {
                this.state.currentServer = 'B';
                this.state.currentReceiver = 'A';
            }
        }

        // 更新发球区域
        this.updateServiceCourt(currentScoreA, currentScoreB);

        // 更新状态
        result.isDeuce = this.state.isDeuce;
        result.isAtCap = this.state.isAtCap;
        result.nextServer = this.state.currentServer;
        result.nextReceiver = this.state.currentReceiver;
        result.serviceCourt = this.state.serviceCourt;

        // 检查换边
        if (this.checkSideChangeNeeded(currentScoreA, currentScoreB, currentGame)) {
            result.needSideChange = this.state.needSideChange;
        }

        // 检查是否到达换边比分 (局间换边在 handleGameEnd 中处理)
        // 第三局11分换边在当前局内处理
        if (currentGame === 3 && (currentScoreA === 11 || currentScoreB === 11)) {
            // 11分时检查是否需要换边
        }

        return result;
    }

    /**
     * 处理双打发球轮换
     * BWF规则:
     * 1. 得分者成为发球方
     * 2. 发球方内两人根据比分奇偶轮换发球位置
     * 3. 接发球方不轮换位置
     */
    handleDoubleServingRotation(winner, scoreA, scoreB) {
        const totalPoints = scoreA + scoreB;

        // 如果得分方是接发球方 (即对方得分)
        // 则发球权转换，但接发球方不变
        if (winner !== this.state.currentServer) {
            // 发球权转换
            const temp = this.state.servingPair;
            this.state.servingPair = this.state.receivingPair;
            this.state.receivingPair = temp;

            this.state.currentServer = winner;
            this.state.currentReceiver = winner === 'A' ? 'B' : 'A';

            // 发球轮换索引重置
            this.state.servingRotationIndex = 0;
        } else {
            // 得分方继续发球 (内轮换)
            // 双打发球时，同一方根据比分奇偶轮换发球
            if (totalPoints % 2 === 1) {
                // 奇得分 - 轮换发球人
                this.state.servingRotationIndex++;
            }
        }
    }

    /**
     * 检查 Deuce 规则
     * 当比分为 20-20 (或 29-29) 时触发
     * 必须领先2分才能获胜
     */
    checkDeuce(scoreA, scoreB) {
        const deucePoint = this.state.scoringSystem - 1; // 20 for 21-point game

        this.state.isDeuce = (
            scoreA >= deucePoint &&
            scoreB >= deucePoint &&
            scoreA === scoreB
        );

        if (this.state.isDeuce && !this.state.deuceStarted) {
            this.state.deuceStarted = true;
        }

        return this.state.isDeuce;
    }

    /**
     * 检查30分封顶规则
     * 当比分为 29-29 时，下一分获胜
     */
    checkCapRule(scoreA, scoreB) {
        const capPoint = this.state.scoringSystem + 9; // 30 for 21-point game

        // 如果双方都达到29分
        if (scoreA >= 29 && scoreB >= 29 && scoreA === scoreB) {
            this.state.isAtCap = true;
            this.state.capReached = true;
        } else if (scoreA > capPoint || scoreB > capPoint) {
            // 超过30分不应该发生
            this.state.fault = 'SCORE_OVERFLOW';
            this.state.faultReason = '比分超出上限';
        }

        return this.state.isAtCap;
    }

    /**
     * 检查比赛是否结束
     * @param {number} scoreA - A方得分
     * @param {number} scoreB - B方得分
     * @param {number} gamesToWin - 需获胜局数
     * @param {number} gamesWonA - A方已获胜局数
     * @param {number} gamesWonB - B方已获胜局数
     */
    checkMatchEnd(scoreA, scoreB, gamesToWin, gamesWonA, gamesWonB) {
        const winningScore = this.state.scoringSystem;
        const winByTwo = 2;

        let winner = null;
        let gameEnded = false;

        // 检查是否赢得当前局
        if (!this.state.isAtCap) {
            // 普通情况: 达到 winningScore 且领先2分
            if (scoreA >= winningScore && scoreA - scoreB >= winByTwo) {
                winner = 'A';
                gameEnded = true;
            } else if (scoreB >= winningScore && scoreB - scoreA >= winByTwo) {
                winner = 'B';
                gameEnded = true;
            }
        } else {
            // 30分封顶情况
            if (scoreA > scoreB) {
                winner = 'A';
                gameEnded = true;
            } else if (scoreB > scoreA) {
                winner = 'B';
                gameEnded = true;
            }
        }

        // 检查是否赢得比赛
        if (gameEnded) {
            const newGamesWonA = winner === 'A' ? gamesWonA + 1 : gamesWonA;
            const newGamesWonB = winner === 'B' ? gamesWonB + 1 : gamesWonB;

            if (newGamesWonA >= gamesToWin) {
                this.state.isMatchComplete = true;
                this.state.winner = winner;
                return { gameEnded: true, matchEnded: true, winner: winner };
            } else if (newGamesWonB >= gamesToWin) {
                this.state.isMatchComplete = true;
                this.state.winner = winner;
                return { gameEnded: true, matchEnded: true, winner: winner };
            }

            return { gameEnded: true, matchEnded: false, winner: winner };
        }

        return { gameEnded: false, matchEnded: false, winner: null };
    }

    /**
     * 处理新局开始
     * @param {number} gameNumber - 局数 (1, 2, 或 3)
     * @param {number} gamesWonA - A方已获胜局数
     * @param {number} gamesWonB - B方已获胜局数
     * @param {string} firstServer - 首发球方
     */
    startNewGame(gameNumber, gamesWonA, gamesWonB, firstServer = null) {
        // 更新第三局标志
        this.state.isThirdGame = (gameNumber === 3);

        // 重置 Deuce 状态
        this.state.isDeuce = false;
        this.state.deuceStarted = false;
        this.state.isAtCap = false;
        this.state.capReached = false;

        // 重置换边状态
        this.state.needSideChange = false;
        this.state.lastSideChangeAt = { playerA: 0, playerB: 0 };

        // 如果有指定首发球方
        if (firstServer) {
            this.state.currentServer = firstServer;
            this.state.servingPair = firstServer;
            this.state.currentReceiver = firstServer === 'A' ? 'B' : 'A';
            this.state.receivingPair = this.state.currentReceiver;
            this.state.servingRotationIndex = 0;
        } else {
            // 常规首发球方轮换: 第一局首发方决定
            // 后续局由前一局非首发方首发
        }

        // 更新场地侧 (局间换边)
        // 根据已完成的局数交换场地
        const sideChanges = Math.min(gamesWonA + gamesWonB, 2) % 2;
        if (sideChanges === 1) {
            const tempSide = this.state.playerACourtSide;
            this.state.playerACourtSide = this.state.playerBCourtSide;
            this.state.playerBCourtSide = tempSide;
        }

        // 重置发球区域
        this.updateServiceCourt(0, 0);

        return this.getState();
    }

    /**
     * 获取当前得分
     */
    getScore(player) {
        // 需要外部传入当前比分，这里返回内部状态仅用于测试
        return 0;
    }

    /**
     * 获取发球区域名称
     */
    getServiceCourtName() {
        const court = this.state.serviceCourt;
        const names = {
            [this.CourtArea.RIGHT_SERVICE_AREA]: '右发球区',
            [this.CourtArea.LEFT_SERVICE_AREA]: '左发球区',
            [this.CourtArea.RIGHT_SINGLES_AREA]: '右区(单打)',
            [this.CourtArea.LEFT_SINGLES_AREA]: '左区(单打)'
        };
        return names[court] || '未知';
    }

    /**
     * 获取发球方站位名称
     */
    getServerPositionName() {
        if (this.state.mode === 'single') {
            return this.state.serviceCourt === this.CourtArea.RIGHT_SINGLES_AREA
                ? '右区' : '左区';
        }

        // 双打
        if (this.state.currentServer === 'A') {
            return this.state.serviceCourt === this.CourtArea.RIGHT_SERVICE_AREA
                ? 'A1 右区发球' : 'A1 左区发球';
        } else {
            return this.state.serviceCourt === this.CourtArea.RIGHT_SERVICE_AREA
                ? 'B1 右区发球' : 'B1 左区发球';
        }
    }

    /**
     * 获取接发球方站位名称
     */
    getReceiverPositionName() {
        if (this.state.mode === 'single') {
            return this.state.serviceCourt === this.CourtArea.RIGHT_SINGLES_AREA
                ? '左区' : '右区';
        }

        // 双打
        if (this.state.currentReceiver === 'B') {
            return this.state.serviceCourt === this.CourtArea.RIGHT_SERVICE_AREA
                ? 'B方左区接发' : 'B方右区接发';
        } else {
            return this.state.serviceCourt === this.CourtArea.RIGHT_SERVICE_AREA
                ? 'A方左区接发' : 'A方右区接发';
        }
    }

    /**
     * 获取站位提示信息
     */
    getPositionHints() {
        const hints = {
            server: this.getServerPositionName(),
            receiver: this.getReceiverPositionName(),
            courtSideA: this.state.playerACourtSide === this.CourtSide.LEFT ? '左侧' : '右侧',
            courtSideB: this.state.playerBCourtSide === this.CourtSide.LEFT ? '左侧' : '右侧',
            serviceCourt: this.getServiceCourtName(),
            instruction: this.getInstruction()
        };

        return hints;
    }

    /**
     * 获取当前指令
     */
    getInstruction() {
        let instruction = '';

        if (this.state.needSideChange) {
            instruction = '请换边！';
        } else if (this.state.isAtCap) {
            instruction = '30分封顶！下一分获胜！';
        } else if (this.state.isDeuce) {
            instruction = 'Deuce！需领先2分获胜';
        } else if (this.state.fault) {
            instruction = `犯规: ${this.state.faultReason}`;
        } else {
            instruction = `${this.state.currentServer === 'A' ? 'A' : 'B'}方发球`;
        }

        return instruction;
    }

    /**
     * 获取详细的场地站位信息 (包含比分原因)
     * @param {number} scoreA - A方得分
     * @param {number} scoreB - B方得分
     */
    getDetailedCourtInfo(scoreA, scoreB) {
        const serverScore = this.state.currentServer === 'A' ? scoreA : scoreB;
        const serverParity = serverScore % 2 === 0 ? '偶数' : '奇数';
        const serviceCourtName = serverParity === '偶数' ? '右发球区' : '左发球区';

        return {
            // 发球方
            server: {
                side: this.state.currentServer,
                player: this.state.currentServer === 'A' ? 'A方' : 'B方',
                courtSide: this.state.currentServer === 'A'
                    ? (this.state.playerACourtSide === this.CourtSide.RIGHT ? '右侧' : '左侧')
                    : (this.state.playerBCourtSide === this.CourtSide.RIGHT ? '右侧' : '左侧'),
                position: this.getServerPositionName()
            },
            // 接发球方
            receiver: {
                side: this.state.currentReceiver,
                player: this.state.currentReceiver === 'A' ? 'A方' : 'B方',
                courtSide: this.state.currentReceiver === 'A'
                    ? (this.state.playerACourtSide === this.CourtSide.RIGHT ? '右侧' : '左侧')
                    : (this.state.playerBCourtSide === this.CourtSide.RIGHT ? '右侧' : '左侧'),
                position: this.getReceiverPositionName()
            },
            // 发球区
            serviceCourt: {
                name: serviceCourtName,
                reason: `发球方得${serverScore}分（${serverParity}）`,
                rule: '偶数分→右发球区，奇数分→左发球区'
            },
            // 对角线原则
            diagonalRule: {
                description: '接发球方必须站在对角对应发球区',
                serverRight: serverParity === '偶数',
                serverLeft: serverParity === '奇数'
            }
        };
    }

    /**
     * 犯规判定
     * @param {string} faultType - 犯规类型
     */
    callFault(faultType) {
        const faults = {
            'OUT': { code: 'OUT', reason: '球出界', pointTo: 'receiver' },
            'NET': { code: 'NET', reason: '触网', pointTo: 'receiver' },
            'FOOTFAULT': { code: 'FOOTFAULT', reason: '脚犯规', pointTo: 'receiver' },
            'SHORT': { code: 'SHORT', reason: '发球过短', pointTo: 'receiver' },
            'LONG': { code: 'LONG', reason: '发球过长', pointTo: 'receiver' },
            'SERVICE_FAULT': { code: 'SERVICE_FAULT', reason: '发球违例', pointTo: 'receiver' },
            'TIMEOUT': { code: 'TIMEOUT', reason: '超时', pointTo: null },
            'CONSECUTIVE_HIT': { code: 'CONSECUTIVE_HIT', reason: '连击', pointTo: 'offender' }
        };

        const fault = faults[faultType] || { code: faultType, reason: '未知犯规', pointTo: null };

        this.state.fault = fault.code;
        this.state.faultReason = fault.reason;

        return fault;
    }

    /**
     * 清除犯规状态
     */
    clearFault() {
        this.state.fault = null;
        this.state.faultReason = null;
    }

    /**
     * 获取裁判模式状态
     */
    enableUmpireMode(enabled = true) {
        this.state.umpireMode = enabled;
        return this.state.umpireMode;
    }

    /**
     * 挑战判定 (可选功能)
     */
    challenge(callBy, originalDecision) {
        if (this.state.challengeAvailable <= 0) {
            return { success: false, reason: '挑战次数已用完' };
        }

        this.state.challengeAvailable--;

        // 模拟挑战结果
        const upheld = Math.random() > 0.5; // 50% 维持原判

        return {
            success: true,
            upheld: upheld,
            remainingChallenges: this.state.challengeAvailable,
            newDecision: upheld ? originalDecision : (originalDecision === 'A' ? 'B' : 'A')
        };
    }

    /**
     * 导出规则状态为 JSON (用于调试和分析)
     */
    exportRulesState() {
        return {
            timestamp: new Date().toISOString(),
            rulesEngine: 'BWF Official Rules v1.0',
            state: this.getState(),
            summary: this.getStatusSummary(),
            hints: this.getPositionHints()
        };
    }
}

/**
 * 规则流程状态机
 *
 * 状态:
 * IDLE -> READY -> PLAYING -> POINT_SCORED -> [GAME_END | SIDE_CHANGE] -> PLAYING
 *                                                        |
 *                                                        v
 *                                                   MATCH_END
 *
 * 事件:
 * - INIT_MATCH: 初始化比赛
 * - START_GAME: 开始一局
 * - POINT_SCORED: 得分
 * - FAULT_CALLED: 犯规
 * - SIDE_CHANGE: 换边
 * - GAME_END: 局结束
 * - MATCH_END: 比赛结束
 */

class BadmintonStateMachine {
    constructor(rulesEngine) {
        this.rules = rulesEngine;
        this.currentState = 'IDLE';
        this.stateHistory = [];

        this.transitions = {
            'IDLE': ['INIT_MATCH'],
            'READY': ['START_GAME'],
            'PLAYING': ['POINT_SCORED', 'FAULT_CALLED', 'SIDE_CHANGE'],
            'POINT_SCORED': ['PLAYING', 'GAME_END', 'SIDE_CHANGE'],
            'SIDE_CHANGE': ['PLAYING'],
            'GAME_END': ['PLAYING', 'MATCH_END'],
            'MATCH_END': ['IDLE']
        };
    }

    /**
     * 执行状态转换
     * @param {string} event - 事件名称
     * @param {Object} data - 事件数据
     */
    transition(event, data = {}) {
        const allowed = this.transitions[this.currentState];

        if (!allowed || !allowed.includes(event)) {
            console.error(`无效转换: ${this.currentState} + ${event}`);
            return { success: false, error: 'Invalid transition' };
        }

        // 记录历史
        this.stateHistory.push({
            from: this.currentState,
            event: event,
            timestamp: Date.now(),
            data: data
        });

        // 执行转换
        switch (event) {
            case 'INIT_MATCH':
                this.rules.initializeMatch(data.config);
                this.currentState = 'READY';
                break;

            case 'START_GAME':
                this.rules.startNewGame(data.gameNumber, data.gamesWonA, data.gamesWonB, data.firstServer);
                this.currentState = 'PLAYING';
                break;

            case 'POINT_SCORED':
                const result = this.rules.handlePoint(
                    data.winner,
                    data.scoreA,
                    data.scoreB,
                    data.gamesWonA,
                    data.gamesWonB,
                    data.currentGame
                );

                if (result.needSideChange) {
                    this.currentState = 'SIDE_CHANGE';
                } else if (result.gameEnded) {
                    this.currentState = 'GAME_END';
                } else {
                    this.currentState = 'POINT_SCORED';
                }
                return result;

            case 'FAULT_CALLED':
                const fault = this.rules.callFault(data.faultType);
                this.currentState = 'PLAYING';
                return fault;

            case 'SIDE_CHANGE':
                this.rules.performSideChange();
                this.currentState = 'PLAYING';
                break;

            case 'GAME_END':
                if (data.matchEnded) {
                    this.currentState = 'MATCH_END';
                } else {
                    this.currentState = 'PLAYING';
                }
                break;

            case 'MATCH_END':
                this.currentState = 'MATCH_END';
                break;
        }

        return { success: true, state: this.currentState };
    }

    /**
     * 获取当前状态
     */
    getState() {
        return this.currentState;
    }

    /**
     * 获取状态历史
     */
    getHistory() {
        return [...this.stateHistory];
    }
}

/**
 * 示例比赛流程演示
 */
function demoMatchFlow() {
    console.log('=== 羽毛球规则引擎演示 ===\n');

    // 初始化规则引擎和状态机
    const rules = new BadmintonRules();
    const stateMachine = new BadmintonStateMachine(rules);

    // 配置比赛: 21分制, 三局两胜, 双打
    const config = {
        mode: 'double',
        scoringSystem: 21,
        gamesToWin: 3,
        firstServer: 'A'
    };

    // 初始化比赛
    stateMachine.transition('INIT_MATCH', { config: config });
    console.log('比赛初始化:', rules.getStatusSummary());

    // 第一局开始
    stateMachine.transition('START_GAME', { gameNumber: 1, gamesWonA: 0, gamesWonB: 0, firstServer: 'A' });
    console.log('\n第一局开始:', rules.getPositionHints());

    // 模拟几个得分
    const points = [
        { winner: 'A', scoreA: 1, scoreB: 0 },
        { winner: 'A', scoreA: 2, scoreB: 0 },
        { winner: 'B', scoreA: 2, scoreB: 1 },
        { winner: 'B', scoreA: 2, scoreB: 2 },
    ];

    console.log('\n--- 模拟得分 ---');
    points.forEach(p => {
        const result = stateMachine.transition('POINT_SCORED', {
            winner: p.winner,
            scoreA: p.scoreA,
            scoreB: p.scoreB,
            gamesWonA: 0,
            gamesWonB: 0,
            currentGame: 1
        });
        console.log(`${p.winner}方得分 (${p.scoreA}-${p.scoreB}):`, rules.getPositionHints());
        console.log('  发球区:', rules.getServiceCourtName());
        console.log('  指令:', rules.getInstruction());
    });

    // 导出规则状态
    console.log('\n--- 规则引擎状态导出 ---');
    console.log(JSON.stringify(rules.exportRulesState(), null, 2));
}

// 导出到全局
window.BadmintonRules = BadmintonRules;
window.BadmintonStateMachine = BadmintonStateMachine;
window.demoMatchFlow = demoMatchFlow;

// 自动运行演示 (可选)
// demoMatchFlow();
