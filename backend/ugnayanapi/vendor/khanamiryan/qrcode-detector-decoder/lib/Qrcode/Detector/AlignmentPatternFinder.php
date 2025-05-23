<?php
/*
 * Copyright 2007 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

namespace Zxing\Qrcode\Detector;

use Zxing\Common\BitMatrix;
use Zxing\NotFoundException;
use Zxing\ResultPointCallback;

/**
 * <p>This class attempts to find alignment patterns in a QR Code. Alignment patterns look like finder
 * patterns but are smaller and appear at regular intervals throughout the image.</p>
 *
 * <p>At the moment this only looks for the bottom-right alignment pattern.</p>
 *
 * <p>This is mostly a simplified copy of {@link FinderPatternFinder}. It is copied,
 * pasted and stripped down here for maximum performance but does unfortunately duplicate
 * some code.</p>
 *
 * <p>This class is thread-safe but not reentrant. Each thread must allocate its own object.</p>
 *
 * @author Sean Owen
 */
final class AlignmentPatternFinder
{
	private $image;
	private $startX;
	private $startY;
	private $width;
	private $height;
	private $moduleSize;
	private $resultPointCallback;
	private $possibleCenters = array();
	private $crossCheckStateCount = array();

	/**
	 * <p>Creates a finder that will look in a portion of the whole image.</p>
	 *
	 * @param image                      image to search
	 * @param startX                     left column from which to start searching
	 * @param startY                     top row from which to start searching
	 * @param width                      width of region to search
	 * @param height                     height of region to search
	 * @param moduleSize                 estimated module size so far
	 * @param resultPointCallback        callback function that will be called when a pattern is found
	 */
	public function __construct($image, $startX, $startY, $width, $height, $moduleSize, $resultPointCallback = null)
	{
		$this->image = $image;
		$this->startX = $startX;
		$this->startY = $startY;
		$this->width = $width;
		$this->height = $height;
		$this->moduleSize = $moduleSize;
		$this->resultPointCallback = $resultPointCallback;
		$this->crossCheckStateCount = array_fill(0, 3, 0);
 }

	/**
	 * <p>This method attempts to find the bottom-right alignment pattern in the image. It is a bit messy since
	 * it's pretty performance-critical and so is written to be fast foremost.</p>
	 *
	 * @return {@link AlignmentPattern} if found
	 * @throws NotFoundException if not found
	 */
	public function find()
	{
		$startX = $this->startX;
		$height = $this->height;
		$maxJ = $startX + $this->width;
		$middleI = $this->startY + ($height >> 1);
		// We are looking for black/white/black modules in 1:1:1 ratio;
		// this tracks the number of black/white/black modules seen so far
		$stateCount = array_fill(0, 3, 0);
		for ($iGen = 0; $iGen < $height; $iGen++) {
			// Search from middle outwards
			$i = $middleI + (($iGen & 0x01) == 0 ? ($iGen + 1) >> 1 : -(($iGen + 1) >> 1));
			$stateCount[0] = 0;
			$stateCount[1] = 0;
			$stateCount[2] = 0;
			$j = $startX;
			// Burn off leading white pixels before anything else; if we start in the middle of
			// a white run, it doesn't make sense to count its length, since we don't know if the
			// white run continued to the left of the start point
			while ($j < $maxJ && !$this->image->get($j, $i)) {
				$j++;
			}
			$currentState = 0;
			while ($j < $maxJ) {
				if ($this->image->get($j, $i)) {
					// Black pixel
					if ($currentState == 1) { // Counting black pixels
						$stateCount[$currentState]++;
					} else { // Counting white pixels
						if ($currentState == 2) { // A winner?
							if ($this->foundPatternCross($stateCount)) { // Yes
								$confirmed = $this->handlePossibleCenter($stateCount, $i, $j);
								if ($confirmed != null) {
									return $confirmed;
								}
							}
							$stateCount[0] = $stateCount[2];
							$stateCount[1] = 1;
							$stateCount[2] = 0;
							$currentState = 1;
						} else {
							$stateCount[++$currentState]++;
						}
					}
				} else { // White pixel
					if ($currentState == 1) { // Counting black pixels
						$currentState++;
					}
					$stateCount[$currentState]++;
				}
				$j++;
			}
			if ($this->foundPatternCross($stateCount)) {
				$confirmed = $this->handlePossibleCenter($stateCount, $i, $maxJ);
				if ($confirmed != null) {
					return $confirmed;
				}
			}
		}

		// Hmm, nothing we saw was observed and confirmed twice. If we had
		// any guess at all, use it.
		if (count($this->possibleCenters)) {
			return $this->possibleCenters[0];
		}

		throw new NotFoundException();
	}

	/**
	 * Given a count of black/white/black pixels just seen and an end position,
	 * figures the location of the center of this black/white/black run.
	 */
	private function centerFromEnd($stateCount, $end)
	{
		return (float)($end - $stateCount[2]) - $stateCount[1] / 2.0;
	}

	/**
	 * @param stateCount count of black/white/black pixels just read
	 * @return true iff the proportions of the counts is close enough to the 1/1/1 ratios
	 *         used by alignment patterns to be considered a match
	 */
	private function foundPatternCross($stateCount)
	{
		$moduleSize = $this->moduleSize;
		$maxVariance = $moduleSize / 2.0;
		for ($i = 0; $i < 3; $i++) {
			if (abs($moduleSize - $stateCount[$i]) >= $maxVariance) {
				return false;
			}
		}
		return true;
	}

	/**
	 * <p>After a horizontal scan finds a potential alignment pattern, this method
	 * "cross-checks" by scanning down vertically through the center of the possible
	 * alignment pattern to see if the same proportion is detected.</p>
	 *
	 * @param startI                  row where an alignment pattern was detected
	 * @param centerJ                 center of the section that appears to cross an alignment pattern
	 * @param maxCount               maximum reasonable number of modules that should be
	 *                               observed in any reading state, based on the results of the horizontal scan
	 * @param originalStateCountTotal The original state count total.
	 * @return vertical center of alignment pattern, or {@link Float#NaN} if not found
	 */
	private function crossCheckVertical($startI, $centerJ, $maxCount, $originalStateCountTotal)
	{
		$image = $this->image;
		$maxI = $image->getHeight();
		$stateCount = $this->crossCheckStateCount;
		$stateCount[0] = 0;
		$stateCount[1] = 0;
		$stateCount[2] = 0;

		// Start counting up from center
		$i = $startI;
		while ($i >= 0 && $image->get($centerJ, $i) && $stateCount[1] <= $maxCount) {
			$stateCount[1]++;
			$i--;
		}
		// If already too many modules in this state or ran off the edge:
		if ($i < 0 || $stateCount[1] > $maxCount) {
			return NAN;
		}
		while ($i >= 0 && !$image->get($centerJ, $i) && $stateCount[0] <= $maxCount) {
			$stateCount[0]++;
			$i--;
		}
		if ($stateCount[0] > $maxCount) {
			return NAN;
		}

		// Now also count down from center
		$i = $startI + 1;
		while ($i < $maxI && $image->get($centerJ, $i) && $stateCount[1] <= $maxCount) {
			$stateCount[1]++;
			$i++;
		}
		if ($i == $maxI || $stateCount[1] > $maxCount) {
			return NAN;
		}
		while ($i < $maxI && !$image->get($centerJ, $i) && $stateCount[2] <= $maxCount) {
			$stateCount[2]++;
			$i++;
		}
		if ($stateCount[2] > $maxCount) {
			return NAN;
		}

		$stateCountTotal = $stateCount[0] + $stateCount[1] + $stateCount[2];
		if (5 * abs($stateCountTotal - $originalStateCountTotal) >= 2 * $originalStateCountTotal) {
			return NAN;
		}

		return $this->foundPatternCross($stateCount) ? $this->centerFromEnd($stateCount, $i) : NAN;
	}

	/**
	 * <p>This is called when a horizontal scan finds a possible alignment pattern. It will
	 * cross check with a vertical scan, and if successful, will see if this pattern had been
	 * found on a previous horizontal scan. If so, we consider it confirmed and conclude we have
	 * found the alignment pattern.</p>
	 *
	 * @param stateCount reading state module counts from horizontal scan
	 * @param i          row where alignment pattern may be found
	 * @param j          end of possible alignment pattern in row
	 * @return {@link AlignmentPattern} if we have found the same pattern twice, or null if not
	 */
	private function handlePossibleCenter($stateCount, $i, $j)
	{
		$stateCountTotal = $stateCount[0] + $stateCount[1] + $stateCount[2];
		$centerJ = $this->centerFromEnd($stateCount, $j);
		$centerI = $this->crossCheckVertical($i, (int)$centerJ, 2 * $stateCount[1], $stateCountTotal);
		if (!is_nan($centerI)) {
			$estimatedModuleSize = ($stateCount[0] + $stateCount[1] + $stateCount[2]) / 3.0;
			foreach ($this->possibleCenters as $center) {
				// Look for about the same center and module size:
				if ($center->aboutEquals($estimatedModuleSize, $centerI, $centerJ)) {
					return $center->combineEstimate($centerI, $centerJ, $estimatedModuleSize);
				}
			}
			// Hadn't found this before; save it
			$point = new AlignmentPattern($centerJ, $centerI, $estimatedModuleSize);
			$this->possibleCenters[] = $point;
			if ($this->resultPointCallback != null) {
				$this->resultPointCallback->foundPossibleResultPoint($point);
			}
		}
		return null;
	}
}
